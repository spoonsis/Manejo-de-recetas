const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

/**
 * GET /api/local/usuarios
 * Lista todos los usuarios (Solo ADMIN)
 */
router.get('/', roleMiddleware('ADMIN'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nombreUsuario, email, rol, nombreCompleto, activo, ultimoAcceso FROM usuarios ORDER BY nombreCompleto ASC"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error listando usuarios:", error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

/**
 * POST /api/local/usuarios
 * Crea un nuevo usuario (Solo ADMIN)
 */
router.post('/', roleMiddleware('ADMIN'), async (req, res) => {
    const { username, email, password, nombreCompleto, rol } = req.body;

    if (!username || !email || !password || !rol) {
        return res.status(400).json({ error: "Faltan datos obligatorios (username, email, password, rol)" });
    }

    try {
        // Verificar existencia
        const [existente] = await pool.query("SELECT id FROM usuarios WHERE nombreUsuario = ? OR email = ?", [username, email]);
        if (existente.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario o email ya existe" });
        }

        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            "INSERT INTO usuarios (id, nombreUsuario, email, passwordHash, rol, nombreCompleto, activo, resetToken) VALUES (?, ?, ?, ?, ?, ?, 1, 'TEMP_PASSWORD')",
            [username, username, email, hash, rol, nombreCompleto || username]
        );

        res.status(201).json({ success: true, message: "Usuario creado exitosamente" });
    } catch (error) {
        console.error("Error creando usuario:", error);
        res.status(500).json({ error: "Error al crear el usuario" });
    }
});

/**
 * DELETE /api/local/usuarios/:id
 * Inactiva un usuario (Solo ADMIN)
 */
router.delete('/:id', roleMiddleware('ADMIN'), async (req, res) => {
    const { id } = req.params;

    if (id === req.usuario.id) {
        return res.status(400).json({ error: "No puedes inactivarte a ti mismo" });
    }

    try {
        const [user] = await pool.query("SELECT activo FROM usuarios WHERE id = ?", [id]);
        if (user.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        const nuevoEstado = user[0].activo ? 0 : 1;
        await pool.query("UPDATE usuarios SET activo = ? WHERE id = ?", [nuevoEstado, id]);

        res.json({ success: true, message: `Usuario ${nuevoEstado ? 'activado' : 'inactivado'} correctamente` });
    } catch (error) {
        console.error("Error gestionando estado de usuario:", error);
        res.status(500).json({ error: "Error al cambiar estado del usuario" });
    }
});

/**
 * GET /api/usuarios/roles/config
 * Retorna la lista de roles, sus permisos, color, datos de auditoría y usuarios activos asignados.
 */
router.get('/roles/config', async (req, res) => {
    try {
        const [roles] = await pool.query(
            "SELECT rol, permisos, color, creadoPor, fechaCreacion FROM configuracion_roles ORDER BY rol ASC"
        );
        
        const result = [];
        for (const r of roles) {
            // Cargar usuarios activos asignados a este rol
            const [usuarios] = await pool.query(
                "SELECT id, nombreUsuario, nombreCompleto, activo FROM usuarios WHERE rol = ? AND (activo = 1 OR activo IS NULL) ORDER BY nombreCompleto ASC",
                [r.rol]
            );
            
            result.push({
                rol: r.rol,
                permisos: typeof r.permisos === 'string' ? JSON.parse(r.permisos) : (r.permisos || []),
                color: r.color,
                creadoPor: r.creadoPor,
                fechaCreacion: r.fechaCreacion,
                usuariosAsignados: usuarios
            });
        }
        
        res.json(result);
    } catch (error) {
        console.error("Error obteniendo configuración de roles:", error);
        res.status(500).json({ error: "Error al obtener la configuración de roles" });
    }
});

/**
 * POST /api/usuarios/roles/config
 * Guarda la configuración completa de roles en la base de datos (Solo ADMIN).
 * Preserva creadoPor y fechaCreacion para los roles existentes.
 */
router.post('/roles/config', roleMiddleware('ADMIN'), async (req, res) => {
    const rolesList = req.body;
    if (!Array.isArray(rolesList)) {
        return res.status(400).json({ error: "El cuerpo debe ser un arreglo de configuraciones de roles" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const rolesEnviados = rolesList.map(r => r.rol);
        
        // 1. Eliminar roles que ya no existen en el listado enviado
        if (rolesEnviados.length > 0) {
            await connection.query("DELETE FROM configuracion_roles WHERE rol NOT IN (?)", [rolesEnviados]);
        } else {
            await connection.query("DELETE FROM configuracion_roles");
        }

        // 2. Insertar o actualizar cada uno de los roles
        for (const item of rolesList) {
            const { rol, permisos, color } = item;
            
            const [existing] = await connection.query(
                "SELECT creadoPor, fechaCreacion FROM configuracion_roles WHERE rol = ?",
                [rol]
            );

            if (existing.length > 0) {
                // Actualizar preservando los metadatos de auditoría
                await connection.query(
                    "UPDATE configuracion_roles SET permisos = ?, color = ? WHERE rol = ?",
                    [JSON.stringify(permisos || []), color || 'bg-slate-500', rol]
                );
            } else {
                // Insertar nuevo rol con el usuario actual y fecha de creación
                await connection.query(
                    "INSERT INTO configuracion_roles (rol, permisos, color, creadoPor, fechaCreacion) VALUES (?, ?, ?, ?, NOW())",
                    [rol, JSON.stringify(permisos || []), color || 'bg-slate-500', req.usuario.nombreUsuario || 'sistema']
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: "Configuración de roles guardada correctamente" });
    } catch (error) {
        await connection.rollback();
        console.error("Error guardando configuración de roles:", error);
        res.status(500).json({ error: "Error al guardar la configuración de roles" });
    } finally {
        connection.release();
    }
});

module.exports = router;
