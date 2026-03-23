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

module.exports = router;
