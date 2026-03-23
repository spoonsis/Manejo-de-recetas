const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { secretKey } = require('../middlewares/authMiddleware');

/**
 * POST /api/auth/register
 * Crea un nuevo usuario con password hasheado
 */
router.post('/register', async (req, res) => {
    const { username, email, password, nombreCompleto, rol } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Faltan datos obligatorios (username, email, password)" });
    }

    try {
        // Verificar si el usuario ya existe
        const [existente] = await pool.query("SELECT id FROM usuarios WHERE nombreUsuario = ? OR email = ?", [username, email]);
        if (existente.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario o email ya está en uso" });
        }

        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            "INSERT INTO usuarios (id, nombreUsuario, email, passwordHash, rol, nombreCompleto, activo) VALUES (?, ?, ?, ?, ?, ?, 1)",
            [username, username, email, hash, rol || 'CHEF', nombreCompleto || username]
        );

        res.status(201).json({ success: true, message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error interno al registrar usuario" });
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    const rawUsername = req.body.username || '';
    const username = rawUsername.trim().toLowerCase();
    const password = req.body.password;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE (LOWER(nombreUsuario) = ? OR LOWER(email) = ?) AND (activo = 1 OR activo IS NULL)",
            [username, username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const usuario = rows[0];

        // REQUISITO V6: Verificar si el hash es válido de bcrypt
        if (!usuario.passwordHash || !usuario.passwordHash.startsWith('$2b$')) {
            console.warn(`Usuario ${usuario.nombreUsuario} intentó entrar con hash antiguo/inválido.`);
            return res.status(403).json({ 
                error: "LOGIN_REQUIRES_RESET", 
                message: "Tu cuenta requiere una actualización de seguridad. Por favor, restablece tu contraseña." 
            });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.passwordHash);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar Token
        const payload = {
            id: usuario.id,
            nombreUsuario: usuario.nombreUsuario,
            nombreCompleto: usuario.nombreCompleto,
            rol: usuario.rol,
            avatar: usuario.avatar
        };

        const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });

        // Setear Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Local network compatibility
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        const { passwordHash: _, ...userNoPass } = usuario;
        res.json({ success: true, user: userNoPass });

        pool.query("UPDATE usuarios SET ultimoAcceso = NOW() WHERE id = ?", [usuario.id]).catch(console.error);

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * POST /api/auth/reset-password
 * Permite cambiar el password (en este caso simplificado por ID de usuario)
 */
router.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ error: "Username y nueva contraseña son requeridos" });
    }

    try {
        const hash = await bcrypt.hash(newPassword, 10);
        const [result] = await pool.query("UPDATE usuarios SET passwordHash = ? WHERE nombreUsuario = ? OR email = ?", [hash, username, username]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ success: true, message: "Contraseña actualizada exitosamente" });
    } catch (error) {
        console.error("Error en reset-password:", error);
        res.status(500).json({ error: "Error al actualizar la contraseña" });
    }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Sesión no encontrada" });

    try {
        const decoded = jwt.verify(token, secretKey);
        res.json({ success: true, user: decoded });
    } catch (e) {
        res.status(401).json({ error: "Sesión expirada" });
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: "Sesión cerrada" });
});

module.exports = router;
