const express = require("express");
const router = express.Router();

const {
    listarTablasAzure,
    listarArticulos,
    buscarItems,
    obtenerProveedores
} = require("../servicios/ServiciosSQLExternos");

router.get("/items/buscar", async (req, res) => {
    try {
        const { q } = req.query; if (!q) return res.json([]);
        const data = await buscarItems(q); res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get("/tablas", async (req, res) => {
    try {
        const data = await listarTablasAzure();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/articulos", async (req, res) => {
    try { const data = await listarArticulos(); res.json(data); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

router.get("/proveedores", async (req, res) => {
    try {
        const data = await obtenerProveedores();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
//