const express = require("express");
const router = express.Router();
const svc = require("../servicios/ServicioNotificaciones");

// GET Obtener notificaciones para un rol
router.get("/", async (req, res) => {
    try {
        const { rol } = req.query;
        if (!rol) return res.status(400).json({ error: "Rol no especificado" });
        const data = await svc.obtenerNotificacionesPorRol(rol);
        res.json(data);
    } catch (e) {
        console.error("Error GET /notificaciones", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// POST Crear una notificacion
router.post("/", async (req, res) => {
    try {
        const { rolDestino, titulo, mensaje, tipo, referenciaId } = req.body;
        const id = await svc.crearNotificacion(rolDestino, titulo, mensaje, tipo, referenciaId);
        res.json({ success: true, id });
    } catch (e) {
        console.error("Error POST /notificaciones", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// PUT Marcar como leida
router.put("/:id/leer", async (req, res) => {
    try {
        await svc.marcarLeida(req.params.id);
        res.json({ success: true });
    } catch (e) {
        console.error("Error PUT /notificaciones/:id/leer", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

module.exports = router;
