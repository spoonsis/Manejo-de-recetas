const express = require('express');
const router = express.Router();
const servicioWorkflows = require('../servicios/ServicioWorkflows');
const { validarEsquema, workflowSchema } = require("../middlewares/validador");

// Obtener todos los flujos
router.get('/', async (req, res) => {
    try {
        const flujos = await servicioWorkflows.obtenerFlujos();
        res.json(flujos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Guardar o actualizar un flujo
router.post('/', validarEsquema(workflowSchema), async (req, res) => {
    try {
        const resultado = await servicioWorkflows.upsertFlujo(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un flujo
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await servicioWorkflows.eliminarFlujo(req.params.id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------------------------------------
// RUTAS PARA FASES DE INSUMOS
// ----------------------------------------------------

// Obtener todas las fases de insumos
router.get('/insumos', async (req, res) => {
    try {
        const fases = await servicioWorkflows.obtenerFasesInsumo();
        res.json(fases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Guardar o actualizar una fase de insumos
router.post('/insumos', async (req, res) => {
    try {
        const resultado = await servicioWorkflows.upsertFaseInsumo(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar una fase de insumos
router.delete('/insumos/:id', async (req, res) => {
    try {
        const resultado = await servicioWorkflows.eliminarFaseInsumo(req.params.id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
