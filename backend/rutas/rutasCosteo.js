const express = require("express");
const router = express.Router();
const CosteoService = require("../servicios/CosteoService");

/**
 * Middleware para filtrar campos sensibles según el rol.
 * Regla 6: Roles distintos a COSTOS no ven totales ni unitarios detallados.
 */
const filtrarCamposCostos = (req, res, next) => {
    const originalJson = res.json;
    const rol = req.headers["x-role"]; // Asumimos que el rol viene en el header para este ejemplo

    res.json = function (data) {
        if (rol !== "COSTOS" && rol !== "ADMIN") {
            const filtrarReceta = (r) => {
                const {
                    totalMP, totalEMP, totalMUDI, gif,
                    costoUnitarioMP, costoUnitarioEMP, costoUnitarioMUDI,
                    costoTotalBase, costoTotalFinal,
                    ...limpia
                } = r;
                return limpia;
            };

            if (Array.isArray(data)) {
                data = data.map(filtrarReceta);
            } else if (typeof data === "object" && data !== null) {
                // Si es un objeto de resultado de cálculo
                if (data.totalMP !== undefined) {
                    return originalJson.call(this, { mensaje: "Acceso restringido a datos de costeo" });
                }
                data = filtrarReceta(data);
            }
        }
        return originalJson.call(this, data);
    };
    next();
};

/**
 * Endpoint para previsualizar el cálculo de una receta.
 */
router.post("/calcular", async (req, res) => {
    const { receta, insumos, todasRecetas } = req.body;
    try {
        const resultados = await CosteoService.calcular(receta, insumos, todasRecetas);
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint para aprobar y generar snapshot (Simulación de persistencia).
 */
router.post("/aprobar", async (req, res) => {
    const { receta, insumos, todasRecetas } = req.body;
    try {
        const snapshot = await CosteoService.generarSnapshot(receta, insumos, todasRecetas);
        // Aquí iría la lógica de guardado en DB
        res.json({
            mensaje: "Receta certificada con snapshot de costos",
            data: snapshot
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
