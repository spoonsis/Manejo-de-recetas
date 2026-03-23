const express = require("express");
const router = express.Router();
const svc = require("../servicios/ServicioRecetasInsumos");
const { validarEsquema, recetaSchema, insumoSchema } = require("../middlewares/validador");

// GET Insumos Locales de la BD MySQL
router.get("/insumos/locales", async (req, res) => {
    try {
        const insumos = await svc.obtenerInsumosLocales();
        res.json(insumos);
    } catch (e) {
        console.error("Error GET /insumos/locales", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// POST Insumos Locales (Crear manual en Ficha de Receta)
router.post("/insumos/locales", validarEsquema(insumoSchema), async (req, res) => {
    try {
        const result = await svc.crearInsumoLocal(req.body);
        res.json({ success: true, insumo: result });
    } catch (e) {
        console.error("Error POST /insumos/locales", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// GET Recuperar todas las Recetas estructuradas paginadas
router.get("/recetas", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const result = await svc.obtenerRecetas(page, limit);
        res.json(result);
    } catch (e) {
        console.error("Error GET /recetas", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// POST o PUT Guardar / Actualizar Receta con ingredientes
router.post("/recetas", validarEsquema(recetaSchema), async (req, res) => {
    try {
        await svc.upsertReceta(req.body);
        res.json({ success: true, message: "Receta guardada/actualizada con éxito." });
    } catch (e) {
        console.error("Error POST /recetas", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// POST Añadir salto de historia de la receta al aprobrase o transitar fase
router.post("/recetas/:id/historial", async (req, res) => {
    try {
        await svc.guardarVersionHistorial(req.params.id, req.body);
        res.json({ success: true, message: "Cambio registrado" });
    } catch (e) {
        console.error(`Error POST /recetas/${req.params.id}/historial`, e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// DELETE Eliminar Receta permanentemente
router.delete("/recetas/:id", async (req, res) => {
    try {
        await svc.eliminarReceta(req.params.id);
        res.json({ success: true, message: "Receta eliminada permanentemente" });
    } catch (e) {
        console.error(`Error DELETE /recetas/${req.params.id}`, e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

// GET Insumos y Recetas Unificados
router.get("/insumos-unificados", async (req, res) => {
    try {
        const insumosLocales = await svc.obtenerInsumosLocales();
        const { data: recetas } = await svc.obtenerRecetas(1, 10000); // Cargamos todas para el selector
        const { listarArticulos } = require("../servicios/ServiciosSQLExternos");
        
        let itemsNetSuite = [];
        try {
            itemsNetSuite = await listarArticulos();
        } catch(e) {
            console.error("Error fetching from NetSuite in unificados:", e);
        }

        const listadoUnificado = [
            ...itemsNetSuite.map(ns => ({
                id: `ns_${ns.id}`,
                originalId: ns.id,
                nombre: ns.nombre,
                tipo: 'INSUMO',
                origen: 'NETSUITE',
                precio: Number(ns.precioCompra || 0),
                marca: ns.marca || '',
                unidad: ns.unidad || 'kg'
            })),
            ...insumosLocales.map(loc => ({
                id: `loc_${loc.id}`,
                originalId: loc.id,
                nombre: loc.nombre,
                tipo: 'INSUMO',
                origen: 'LOCAL',
                precio: Number(loc.precioCompra || loc.precioPorUnidad || 0)
            })),
            ...recetas.map(r => ({
                id: `rec_${r.id}`,
                originalId: r.id,
                nombre: r.nombre,
                tipo: 'RECETA', // Tratadas como semielaborados
                origen: 'LOCAL',
                precio: Number(r.costoTotalFinal || r.costoTotal || 0)
            }))
        ];

        res.json(listadoUnificado);
    } catch (e) {
        console.error("Error GET /insumos-unificados", e);
        res.status(500).json({ error: "Error interno del servidor. Contacte a soporte." });
    }
});

module.exports = router;
