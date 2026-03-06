const express = require("express");
const router = express.Router();
const svc = require("../servicios/ServicioRecetasInsumos");

// GET Insumos Locales de la BD MySQL
router.get("/insumos/locales", async (req, res) => {
    try {
        const insumos = await svc.obtenerInsumosLocales();
        res.json(insumos);
    } catch (e) {
        console.error("Error GET /insumos/locales", e);
        res.status(500).json({ error: e.message });
    }
});

// POST Insumos Locales (Crear manual en Ficha de Receta)
router.post("/insumos/locales", async (req, res) => {
    try {
        const result = await svc.crearInsumoLocal(req.body);
        res.json({ success: true, insumo: result });
    } catch (e) {
        console.error("Error POST /insumos/locales", e);
        res.status(500).json({ error: e.message });
    }
});

// GET Recuperar todas las Recetas estructuradas
router.get("/recetas", async (req, res) => {
    try {
        const recetas = await svc.obtenerRecetas();
        res.json(recetas);
    } catch (e) {
        console.error("Error GET /recetas", e);
        res.status(500).json({ error: e.message });
    }
});

// POST o PUT Guardar / Actualizar Receta con ingredientes
router.post("/recetas", async (req, res) => {
    try {
        await svc.upsertReceta(req.body);
        res.json({ success: true, message: "Receta guardada/actualizada con éxito." });
    } catch (e) {
        console.error("Error POST /recetas", e);
        res.status(500).json({ error: e.message });
    }
});

// POST Añadir salto de historia de la receta al aprobrase o transitar fase
router.post("/recetas/:id/historial", async (req, res) => {
    try {
        await svc.guardarVersionHistorial(req.params.id, req.body);
        res.json({ success: true, message: "Cambio registrado" });
    } catch (e) {
        console.error(`Error POST /recetas/${req.params.id}/historial`, e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
