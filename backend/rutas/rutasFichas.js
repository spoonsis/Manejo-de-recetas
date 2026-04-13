const express = require("express");
const router = express.Router();
const svc = require("../servicios/ServicioFichas");
const { validarEsquema, fichaSchema } = require("../middlewares/validador");

// GET Obtener las fichas tecnicas registradas
router.get("/fichas", async (req, res) => {
    try {
        const fichas = await svc.obtenerFichas();
        res.json(fichas);
    } catch (e) {
        console.error("Error GET /fichas", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// POST Guardar o Actualizar una ficha tecnica
router.post("/fichas", validarEsquema(fichaSchema), async (req, res) => {
    try {
        await svc.upsertFicha(req.body);
        res.json({ success: true, message: "Ficha técnica guardada/actualizada con éxito." });
    } catch (e) {
        console.error("Error POST /fichas", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// DELETE Eliminar una ficha tecnica
router.delete("/fichas/:id", async (req, res) => {
    try {
        const success = await svc.eliminarFicha(req.params.id);
        if (success) {
            res.json({ success: true, message: "Ficha técnica eliminada con éxito." });
        } else {
            res.status(404).json({ error: "No se encontró la ficha técnica." });
        }
    } catch (e) {
        console.error("Error DELETE /fichas/:id", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

module.exports = router;
