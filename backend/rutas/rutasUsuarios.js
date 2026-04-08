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

module.exports = router;
