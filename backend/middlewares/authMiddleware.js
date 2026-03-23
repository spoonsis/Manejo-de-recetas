const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'gastroflow_secret_key_2026';

const authMiddleware = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: "No autorizado. Sesión no encontrada." });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.usuario = decoded;
        console.log(`[AUTH] User ${decoded.nombreUsuario} authenticated (${decoded.rol})`);
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ error: "Sesión inválida o expirada." });
    }
};

module.exports = { authMiddleware, secretKey };
