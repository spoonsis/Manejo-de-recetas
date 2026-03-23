const { z } = require("zod");

// Middleware generico para validar con Zod
const validarEsquema = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("Error de validación Zod:", e.errors);
            return res.status(400).json({
                error: "Datos inválidos en la petición.",
                detalles: e.errors.map(err => ({ campo: err.path.join('.'), mensaje: err.message }))
            });
        }
        next(e);
    }
};

// Esquema para la creación/actualización de Recetas
const recetaSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1, "El nombre de la receta es obligatorio"),
    estado: z.string().optional(),
    rindeMasa: z.number().optional().nullable(),
    unidades: z.number().optional().nullable(),
    merma: z.number().optional().nullable(),
    multiplicadorDefault: z.number().optional().nullable(),
    preparacion: z.string().optional().nullable(),
    equipamiento: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
    codigoCalidad: z.string().optional().nullable(),
    ingredientes: z.array(z.any()).optional()
}).passthrough();

// Esquema para Insumos Locales
const insumoSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1, "El nombre del insumo es obligatorio"),
    precioCompra: z.number().min(0).optional(),
    rendimiento: z.number().optional(),
    unidadCompra: z.string().optional(),
    unidadReceta: z.string().optional(),
    codigoSAP: z.string().optional().nullable(),
    tipo: z.string().optional()
}).passthrough();

// Esquema para Fichas Técnicas
const fichaSchema = z.object({
    id: z.string().optional(),
    recetaId: z.string().min(1, "El ID de la receta es obligatorio"),
    estado: z.string().optional()
}).passthrough();

// Esquema para Flujos de Aprobación
const workflowSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1, "El nombre del flujo es obligatorio"),
    pasos: z.array(z.any()).optional()
}).passthrough();

module.exports = {
    validarEsquema,
    recetaSchema,
    insumoSchema,
    fichaSchema,
    workflowSchema
};
