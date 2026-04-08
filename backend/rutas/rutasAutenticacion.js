const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const { secretKey } = require('../middlewares/authMiddleware');

// Configuración de Nodemailer Transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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
            "INSERT INTO usuarios (id, nombreUsuario, email, passwordHash, rol, nombreCompleto, activo, resetToken) VALUES (?, ?, ?, ?, ?, ?, 1, 'TEMP_PASSWORD')",
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

        if (usuario.resetToken === 'TEMP_PASSWORD') {
            return res.status(200).json({
                error: "PASSWORD_CHANGE_REQUIRED",
                message: "Debes cambiar tu contraseña antes de continuar"
            });
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
 * POST /api/auth/change-password
 */
router.post('/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE nombreUsuario = ?", [username]);
        if (rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });
        const usuario = rows[0];
        
        const passwordMatch = await bcrypt.compare(currentPassword, usuario.passwordHash);
        if (!passwordMatch) return res.status(401).json({ error: "Credenciales inválidas" });

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE usuarios SET passwordHash = ?, resetToken = NULL, resetTokenExpira = NULL WHERE nombreUsuario = ?", [hash, username]);
        
        res.json({ success: true, message: "Contraseña actualizada exitosamente" });
    } catch (error) {
        console.error("Error en change-password:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email requerido" });
    }

    try {
        // Step 1: Clear previous tokens
        await pool.query("UPDATE usuarios SET resetToken = NULL, resetTokenExpira = NULL WHERE email = ?", [email]);

        // Validate user existence but do not reveal it
        const [rows] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (rows.length > 0) {
            // Step 2 & 3: Generate and Hash token
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            // Step 4: Store in DB
            await pool.query(
                "UPDATE usuarios SET resetToken = ?, resetTokenExpira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?",
                [hashedToken, email]
            );

            // Step 5: Enviar correo electrónico real
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
            
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                try {
                    await transporter.sendMail({
                        from: `"GastroFlow Pro" <${process.env.SMTP_USER}>`,
                        to: email,
                        subject: "Recuperación de Contraseña - GastroFlow Pro",
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                                <h2 style="color: #0f172a; text-align: center;">Recuperación de Acceso</h2>
                                <p style="color: #475569; font-size: 16px;">Hola,</p>
                                <p style="color: #475569; font-size: 16px;">Hemos recibido una solicitud para restablecer tu contraseña en GastroFlow Pro. Si fuiste tú, por favor asegúrate de clicar el botón de abajo.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                        Restablecer mi Contraseña
                                    </a>
                                </div>
                                <p style="color: #475569; font-size: 14px;">Este enlace es seguro y expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar el correo.</p>
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                                <p style="color: #94a3b8; font-size: 12px; text-align: center;">GastroFlow Pro &copy; 2026</p>
                            </div>
                        `
                    });
                    console.log(`[EMAIL ENVIADO] Recuperación enviada exitosamente a ${email}`);
                } catch (emailError) {
                    console.error("[EMAIL ERROR] Falló el envío del correo:", emailError);
                }
            } else {
                console.log(`\n========================================`);
                console.log(`[SIMULATED EMAIL TO: ${email}]`);
                console.log(`Link para restablecer contraseña:`);
                console.log(resetLink);
                console.log(`\n⚠️ ATENCIÓN: El correo NO se envió porque no has configurado SMTP_USER y SMTP_PASS en el .env`);
                console.log(`========================================\n`);
            }
        }

        res.json({ success: true, message: "Si el correo está registrado, recibirás un enlace de recuperación." });
    } catch (error) {
        console.error("Error en forgot-password:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const [rows] = await pool.query(
            "SELECT id FROM usuarios WHERE resetToken = ? AND resetTokenExpira > NOW()",
            [hashedToken]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: "Token inválido o expirado" });
        }

        const userId = rows[0].id;
        const hash = await bcrypt.hash(newPassword, 10);
        
        await pool.query(
            "UPDATE usuarios SET passwordHash = ?, resetToken = NULL, resetTokenExpira = NULL WHERE id = ?", 
            [hash, userId]
        );

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
