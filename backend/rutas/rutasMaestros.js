const express = require("express");
const router = express.Router();
const { obtenerAreas, guardarArea, eliminarArea, editarArea } = require("../servicios/ServicioMaestros");

router.get("/areas", async (req, res) => {
    console.log("[DEBUG] Fetching areas...");
    try {
        const data = await obtenerAreas();
        console.log(`[DEBUG] Found ${data.length} areas`);
        res.json(data);
    } catch (error) {
        console.error("[DEBUG] Error fetching areas:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/areas", async (req, res) => {
    try {
        const { nombre } = req.body;
        const result = await guardarArea(nombre);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/areas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const result = await editarArea(id, nombre);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/areas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await eliminarArea(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
