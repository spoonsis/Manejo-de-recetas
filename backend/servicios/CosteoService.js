const { obtenerCostoItem } = require("./ServiciosSQLExternos");

/**
 * Motor de Costeo Jerárquico
 */
class CosteoService {
    /**
     * Calcula los costos de una receta de forma jerárquica.
     * @param {Object} receta - La receta a calcular.
     * @param {Array} todosInsumos - Lista maestra de insumos.
     * @param {Array} todasRecetas - Lista maestra de recetas (para buscar subrecetas).
     */
    static async calcular(receta, todosInsumos, todasRecetas) {
        let totalMP = 0;
        let totalEMP = 0;
        let totalMUDI = receta.mudi || 0;

        for (const ing of receta.ingredientes) {
            if (ing.tipo === 'INSUMO') {
                const insumo = todosInsumos.find(i => i.id === ing.idReferencia);

                // Prioridad Costo NetSuite si tiene codigoNetSuite (externalid)
                let costoUnitario = ing.costoUnitario || 0;
                const idNetSuite = ing.codigoNetSuite;

                if (idNetSuite) {
                    const costoNetSuite = await obtenerCostoItem(idNetSuite);
                    if (costoNetSuite === null || costoNetSuite === 0) {
                        throw new Error(`El artículo ${idNetSuite} no tiene costo promedio definido.`);
                    }
                    costoUnitario = costoNetSuite;
                } else if (insumo) {
                    // Si no es NetSuite, usamos el del insumo local si existe
                    costoUnitario = insumo.precioPorUnidad || costoUnitario;
                }

                const costoTotal = costoUnitario * ing.cantidad;

                // Guardamos el costo obtenido/validado de vuelta en el ingrediente para que el snapshot sea correcto
                ing.costoUnitario = costoUnitario;
                ing.costoTotal = costoTotal;

                const tipo = (ing.tipoMaterial || (insumo ? insumo.tipoMaterial : '') || '').toUpperCase();
                if (tipo.includes('EMPAQUE')) {
                    totalEMP += costoTotal;
                } else if (tipo.includes('MODI')) {
                    totalMUDI += costoTotal;
                } else {
                    totalMP += costoTotal;
                }
            } else if (ing.tipo === 'SEMIELABORADO') {
                const subreceta = todasRecetas.find(r => r.id === ing.idReferencia);
                if (subreceta) {
                    const factor = ing.cantidad;
                    totalMP += (subreceta.costoUnitarioMP || 0) * factor;
                    totalEMP += (subreceta.costoUnitarioEMP || 0) * factor;
                    totalMUDI += (subreceta.costoUnitarioMUDI || 0) * factor;
                }
            }
        }

        const costoTotalBase = totalMP + totalEMP + totalMUDI;
        const costoTotalFinal = costoTotalBase + (receta.gif || 0);

        let divisor = 1;
        if (receta.tipoCosteo === 'GRAMO') {
            divisor = receta.pesoTotalCantidad || 1;
        } else if (receta.tipoCosteo === 'UNIDAD') {
            divisor = receta.porcionesCantidad || 1;
        }

        return {
            totalMP,
            totalEMP,
            totalMUDI,
            costoTotalBase,
            costoTotalFinal,
            costoUnitarioMP: totalMP / divisor,
            costoUnitarioEMP: totalEMP / divisor,
            costoUnitarioMUDI: totalMUDI / divisor
        };
    }

    /**
     * Crea un snapshot de costos al momento de aprobar.
     */
    static async generarSnapshot(receta, todosInsumos, todasRecetas) {
        // Al calcular ya se validan los costos de NetSuite e inyectan en receta.ingredientes
        const resultados = await this.calcular(receta, todosInsumos, todasRecetas);

        const ingredientesConSnapshot = receta.ingredientes.map(ing => {
            let costoU = ing.costoUnitario; // Ya actualizado por calcular() si era NetSuite
            let version = null;

            if (ing.tipo === 'SEMIELABORADO') {
                const sub = todasRecetas.find(r => r.id === ing.idReferencia);
                if (sub) {
                    costoU = sub.costoTotalFinal / (sub.tipoCosteo === 'GRAMO' ? sub.pesoTotalCantidad : sub.porcionesCantidad);
                    version = sub.versionActual;
                }
            }

            return {
                ...ing,
                snapshotCostoUnitario: costoU,
                snapshotVersion: version
            };
        });

        return {
            resultados,
            ingredientesConSnapshot
        };
    }
}

module.exports = CosteoService;
