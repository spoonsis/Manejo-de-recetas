
const roleMiddleware = (rolRequerido) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: "No autenticado" });
        }

        if (req.usuario.rol !== rolRequerido && req.usuario.rol !== 'ADMIN') {
            return res.status(403).json({ error: `Acceso denegado. Se requiere el rol ${rolRequerido}.` });
        }

        next();
    };
};

module.exports = { roleMiddleware };
