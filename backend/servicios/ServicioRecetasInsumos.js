const pool = require("../config/database");

async function obtenerInsumosLocales() {
    const [rows] = await pool.query("SELECT * FROM insumos");
    return rows.map(r => ({
        ...r,
        lote: r.lote === 1,
        alergenos: r.alergenos === 1,
        locales: r.locales === 1
    }));
}

async function crearInsumoLocal(data) {
    const { id, nombre, estado, source, tipoMaterial, unidad, unidadStock, precioCompra, precioPorUnidad, pesoBruto, pesoNeto } = data;
    await pool.query(`
        INSERT INTO insumos (id, nombre, estado, source, tipoMaterial, unidad, unidadStock, precioCompra, precioPorUnidad, pesoBruto, pesoNeto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nombre=VALUES(nombre), estado=VALUES(estado), tipoMaterial=VALUES(tipoMaterial), 
            unidad=VALUES(unidad), precioCompra=VALUES(precioCompra), precioPorUnidad=VALUES(precioPorUnidad)
    `, [
        id, nombre, estado || 'PENDIENTE_COMPRAS', source || 'INTERNA',
        tipoMaterial || '', unidad || '', unidadStock || '',
        precioCompra || 0, precioPorUnidad || 0, pesoBruto || 0, pesoNeto || 0
    ]);
    return { id, nombre };
}

async function obtenerRecetas() {
    const [recetas] = await pool.query("SELECT * FROM recetas");
    const [ingredientes] = await pool.query("SELECT * FROM ingredientes_receta");
    const [historial] = await pool.query("SELECT * FROM historial_versiones");

    return recetas.map(r => {
        r.pasos = typeof r.pasos === 'string' ? JSON.parse(r.pasos || "[]") : (r.pasos || []);
        r.esSubReceta = r.esSubReceta === 1;
        r.esSemielaborado = r.esSemielaborado === 1;

        r.ingredientes = ingredientes.filter(i => i.receta_id === r.id).map(ing => ({
            ...ing,
            cantidad: Number(ing.cantidad),
            costoUnitario: Number(ing.costoUnitario),
            costoTotal: Number(ing.costoTotal)
        }));

        r.versiones = historial.filter(h => h.receta_id === r.id).map(h => ({
            ...h,
            snapshotCostos: typeof h.snapshotCostos === 'string' ? JSON.parse(h.snapshotCostos || "{}") : h.snapshotCostos
        }));

        // Transformar numéricos
        ['costoTotal', 'mudi', 'gif', 'totalMP', 'totalEMP', 'totalMUDI', 'costoTotalBase', 'costoTotalFinal'].forEach(k => {
            r[k] = Number(r[k] || 0);
        });

        return r;
    });
}

async function upsertReceta(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            id, nombre, estado, versionActual, pasos, costoTotal,
            esSubReceta, tipoCosteo, mudi, gif,
            totalMP, totalEMP, totalMUDI, costoTotalBase, costoTotalFinal,
            codigoCalidad
        } = data;

        await conn.query(`
            INSERT INTO recetas (
                id, nombre, estado, versionActual, pasos, costoTotal, 
                esSubReceta, tipoCosteo, mudi, gif, 
                totalMP, totalEMP, totalMUDI, costoTotalBase, costoTotalFinal, codigoCalidad
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nombre=VALUES(nombre), estado=VALUES(estado), versionActual=VALUES(versionActual), 
                pasos=VALUES(pasos), costoTotal=VALUES(costoTotal), tipoCosteo=VALUES(tipoCosteo), 
                mudi=VALUES(mudi), gif=VALUES(gif), totalMP=VALUES(totalMP), totalEMP=VALUES(totalEMP), 
                totalMUDI=VALUES(totalMUDI), costoTotalBase=VALUES(costoTotalBase), 
                costoTotalFinal=VALUES(costoTotalFinal), codigoCalidad=VALUES(codigoCalidad)
        `, [
            id, nombre, estado, versionActual || 1, JSON.stringify(pasos || []), costoTotal || 0,
            esSubReceta ? 1 : 0, tipoCosteo || 'GRAMO', mudi || 0, gif || 0,
            totalMP || 0, totalEMP || 0, totalMUDI || 0, costoTotalBase || 0, costoTotalFinal || 0,
            codigoCalidad || null
        ]);

        // Limpiar ingredientes existentes de esta receta
        await conn.query(`DELETE FROM ingredientes_receta WHERE receta_id = ?`, [id]);

        // Insertar los nuevos (estado actual de la receta)
        if (data.ingredientes && data.ingredientes.length > 0) {
            const ingValues = data.ingredientes.map(i => [
                Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9),
                id,
                i.tipo || 'INSUMO',
                i.idReferencia,
                i.nombre,
                i.cantidad || 0,
                i.unidad || '',
                i.costoUnitario || 0,
                i.costoTotal || 0,
                i.codigo || null,
                i.codigoNetSuite || null,
                i.descripcionIngrediente || null,
                i.tipoMaterial || null
            ]);

            await conn.query(`
                INSERT INTO ingredientes_receta (
                    id, receta_id, tipo, idReferencia, nombre, cantidad, unidad, 
                    costoUnitario, costoTotal, codigo, codigoNetSuite, 
                    descripcionIngrediente, tipoMaterial
                ) VALUES ?
            `, [ingValues]);
        }

        // Historial provisto en la data completa
        if (data.versiones && data.versiones.length > 0) {
            await conn.query(`DELETE FROM historial_versiones WHERE receta_id = ?`, [id]);
            const histValues = data.versiones.map(h => [
                id, h.numeroVersion, new Date(h.fechaAprobacion || Date.now()), h.codigoCalidad || null,
                h.registroCambios || null, h.aprobadoPorCostos || null, h.aprobadoPorMkt || null,
                JSON.stringify(h.snapshotCostos || {})
            ]);

            await conn.query(`
                INSERT INTO historial_versiones (
                    receta_id, numeroVersion, fechaAprobacion, codigoCalidad, 
                    registroCambios, aprobadoPorCostos, aprobadoPorMkt, snapshotCostos
                ) VALUES ?
            `, [histValues]);
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

async function guardarVersionHistorial(recetaId, snapshot) {
    const { numeroVersion, fechaAprobacion, codigoCalidad, registroCambios, aprobadoPorCostos, aprobadoPorMkt, snapshotCostos } = snapshot;
    await pool.query(`
        INSERT INTO historial_versiones (receta_id, numeroVersion, fechaAprobacion, codigoCalidad, registroCambios, aprobadoPorCostos, aprobadoPorMkt, snapshotCostos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [recetaId, numeroVersion, new Date(fechaAprobacion), codigoCalidad, registroCambios, aprobadoPorCostos, aprobadoPorMkt, JSON.stringify(snapshotCostos || {})]);
    return true;
}

module.exports = { obtenerInsumosLocales, crearInsumoLocal, obtenerRecetas, upsertReceta, guardarVersionHistorial };
