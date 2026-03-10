const express = require("express");
const router = express.Router();
const svc = require("../servicios/ServicioFichas");

// GET Obtener las fichas tecnicas registradas
router.get("/fichas", async (req, res) => {
    try {
        const fichas = await svc.obtenerFichas();
        res.json(fichas);
    } catch (e) {
        console.error("Error GET /fichas", e);
        res.status(500).json({ error: e.message });
    }
});

// POST Guardar o Actualizar una ficha tecnica
router.post("/fichas", async (req, res) => {
    try {
        await svc.upsertFicha(req.body);
        res.json({ success: true, message: "Ficha técnica guardada/actualizada con éxito." });
    } catch (e) {
        console.error("Error POST /fichas", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
