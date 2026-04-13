const pool = require("../config/database");

async function obtenerInsumosLocales() {
    const [rows] = await pool.query("SELECT * FROM insumos");
    return rows.map(r => ({
        ...r,
        lote: r.lote === 1,
        alergenos: r.alergenos === 1,
        locales: r.locales,
        documentos: typeof r.documentos === 'string' ? JSON.parse(r.documentos || "[]") : (r.documentos || []),
        // Convertir decimales a números
        precioCompra: Number(r.precioCompra || 0),
        precioPorUnidad: Number(r.precioPorUnidad || 0),
        pesoBruto: Number(r.pesoBruto || 0),
        pesoNeto: Number(r.pesoNeto || 0),
        factorConversion: Number(r.factorConversion || 1),
        cantidadConvertida: Number(r.cantidadConvertida || 0),
        cantidadCompra: Number(r.cantidadCompra || 0)
    }));
}

async function crearInsumoLocal(data) {
    const { 
        id, nombre, estado, source, marca, tipoMaterial, unidad, unidadStock, 
        precioCompra, precioPorUnidad, pesoBruto, pesoNeto,
        tipoImpuesto, proveedor, codigoBarras, locales, documentos,
        lote, alergenos, descripcionAlergenos, tipoAlmacenamiento,
        seccionAlisto, clasificacion, unidadConsumo, factorConversion,
        cantidadConvertida, cantidadCompra
    } = data;

    await pool.query(`
        INSERT INTO insumos (
            id, nombre, estado, source, marca, tipoMaterial, unidad, unidadStock, 
            precioCompra, precioPorUnidad, pesoBruto, pesoNeto,
            tipoImpuesto, proveedor, codigoBarras, locales, documentos,
            lote, alergenos, descripcionAlergenos, tipoAlmacenamiento,
            seccionAlisto, clasificacion, unidadConsumo, factorConversion,
            cantidadConvertida, cantidadCompra
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nombre=VALUES(nombre), estado=VALUES(estado), marca=VALUES(marca), 
            tipoMaterial=VALUES(tipoMaterial), unidad=VALUES(unidad), unidadStock=VALUES(unidadStock),
            precioCompra=VALUES(precioCompra), precioPorUnidad=VALUES(precioPorUnidad), 
            pesoBruto=VALUES(pesoBruto), pesoNeto=VALUES(pesoNeto),
            tipoImpuesto=VALUES(tipoImpuesto), proveedor=VALUES(proveedor), 
            codigoBarras=VALUES(codigoBarras), locales=VALUES(locales), 
            documentos=VALUES(documentos), lote=VALUES(lote), 
            alergenos=VALUES(alergenos), descripcionAlergenos=VALUES(descripcionAlergenos), 
            tipoAlmacenamiento=VALUES(tipoAlmacenamiento), seccionAlisto=VALUES(seccionAlisto), 
            clasificacion=VALUES(clasificacion), unidadConsumo=VALUES(unidadConsumo), 
            factorConversion=VALUES(factorConversion), cantidadConvertida=VALUES(cantidadConvertida), 
            cantidadCompra=VALUES(cantidadCompra)
    `, [
        id, nombre, estado || 'PENDIENTE_COMPRAS', source || 'INTERNA', marca || '',
        tipoMaterial || '', unidad || '', unidadStock || '',
        precioCompra || 0, precioPorUnidad || 0, pesoBruto || 0, pesoNeto || 0,
        tipoImpuesto || 'Exento', proveedor || '', codigoBarras || '', 
        (locales === true || locales === 1 || locales === '1') ? 'Si' : 
        (locales === false || locales === 0 || locales === '0' || !locales) ? 'No' : locales,
        JSON.stringify(documentos || []), lote ? 1 : 0, alergenos ? 1 : 0, 
        descripcionAlergenos || '', tipoAlmacenamiento || '', seccionAlisto || '', 
        clasificacion || '', unidadConsumo || '', factorConversion || 1, 
        cantidadConvertida || 0, cantidadCompra || 0
    ]);
    return { id, nombre };
}

async function obtenerRecetas(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    // Obtenemos las estadísticas globales para el Dashboard
    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM recetas");
    const [[{ aprobadas }]] = await pool.query("SELECT COUNT(DISTINCT nombre) as aprobadas FROM recetas WHERE estado = 'APROBADO'");
    const [[{ pendientes }]] = await pool.query("SELECT COUNT(*) as pendientes FROM recetas WHERE estado LIKE '%PENDIENTE%'");

    // Obtenemos solo las recetas de la página actual
    const [recetas] = await pool.query(`SELECT * FROM recetas ORDER BY fecha_revision DESC LIMIT ? OFFSET ?`, [Number(limit), Number(offset)]);
    
    // Optimizamos obteniendo ingredientes e historial SOLO de las recetas actuales
    const ids = recetas.map(r => r.id);
    let ingredientes = [];
    let historial = [];
    if (ids.length > 0) {
        [ingredientes] = await pool.query("SELECT * FROM ingredientes_receta WHERE receta_id IN (?)", [ids]);
        [historial] = await pool.query("SELECT * FROM historial_versiones WHERE receta_id IN (?)", [ids]);
    }

    const data = recetas.map(r => {
        r.pasos = typeof r.pasos === 'string' ? JSON.parse(r.pasos || "[]") : (r.pasos || []);
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
        ['costoTotal', 'mudi', 'gif', 'totalMP', 'totalEMP', 'totalMUDI', 'costoTotalBase', 'costoTotalFinal', 'pesoTotalCantidad', 'tiempoPrepCantidad', 'porcionesCantidad', 'pesoPorcionCantidad', 'mermaCantidad', 'sumaTotalInsumos', 'costoUnitarioMP', 'costoUnitarioEMP', 'costoUnitarioMUDI'].forEach(k => {
            r[k] = Number(r[k] || 0);
        });

        r.flujoAprobacionId = r.flujo_aprobacion_id;
        r.fechaRevision = r.fecha_revision;

        return r;
    });

    return {
        data,
        stats: { total, aprobadas, pendientes },
        page: Number(page),
        limit: Number(limit)
    };
}

async function upsertReceta(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const {
            id, nombre, estado, versionActual, pasos, costoTotal,
            esSemielaborado, tipoCosteo, mudi, gif,
            totalMP, totalEMP, totalMUDI, costoTotalBase, costoTotalFinal,
            codigoCalidad,
            pesoTotalCantidad, pesoTotalUnidad, tiempoPrepCantidad, tiempoPrepUnidad,
            porcionesCantidad, porcionesUnidad, pesoPorcionCantidad, pesoPorcionUnidad,
            mermaCantidad, mermaUnidad, sumaTotalInsumos, subsidiaria,
            elaboradoPor, aprobadoPor, areaProduce, areaEmpaca,
            flujoAprobacionId, costoUnitarioMP, costoUnitarioEMP, costoUnitarioMUDI,
            ultimoRegistroCambios, fechaRevision
        } = data;

        await conn.query(`
            INSERT INTO recetas (
                id, nombre, estado, versionActual, pasos, costoTotal, 
                esSemielaborado, tipoCosteo, mudi, gif, 
                totalMP, totalEMP, totalMUDI, costoTotalBase, costoTotalFinal, codigoCalidad,
                pesoTotalCantidad, pesoTotalUnidad, tiempoPrepCantidad, tiempoPrepUnidad,
                porcionesCantidad, porcionesUnidad, pesoPorcionCantidad, pesoPorcionUnidad,
                mermaCantidad, mermaUnidad, sumaTotalInsumos, subsidiaria,
                elaboradoPor, aprobadoPor, areaProduce, areaEmpaca,
                flujo_aprobacion_id, costoUnitarioMP, costoUnitarioEMP, costoUnitarioMUDI,
                ultimoRegistroCambios, fecha_revision
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nombre=VALUES(nombre), estado=VALUES(estado), versionActual=VALUES(versionActual), 
                pasos=VALUES(pasos), costoTotal=VALUES(costoTotal), tipoCosteo=VALUES(tipoCosteo), 
                mudi=VALUES(mudi), gif=VALUES(gif), totalMP=VALUES(totalMP), totalEMP=VALUES(totalEMP), 
                totalMUDI=VALUES(totalMUDI), costoTotalBase=VALUES(costoTotalBase), 
                costoTotalFinal=VALUES(costoTotalFinal), codigoCalidad=VALUES(codigoCalidad),
                pesoTotalCantidad=VALUES(pesoTotalCantidad), pesoTotalUnidad=VALUES(pesoTotalUnidad),
                tiempoPrepCantidad=VALUES(tiempoPrepCantidad), tiempoPrepUnidad=VALUES(tiempoPrepUnidad),
                porcionesCantidad=VALUES(porcionesCantidad), porcionesUnidad=VALUES(porcionesUnidad),
                pesoPorcionCantidad=VALUES(pesoPorcionCantidad), pesoPorcionUnidad=VALUES(pesoPorcionUnidad),
                mermaCantidad=VALUES(mermaCantidad), mermaUnidad=VALUES(mermaUnidad),
                sumaTotalInsumos=VALUES(sumaTotalInsumos), subsidiaria=VALUES(subsidiaria),
                elaboradoPor=VALUES(elaboradoPor), aprobadoPor=VALUES(aprobadoPor),
                areaProduce=VALUES(areaProduce), areaEmpaca=VALUES(areaEmpaca),
                flujo_aprobacion_id=VALUES(flujo_aprobacion_id),
                costoUnitarioMP=VALUES(costoUnitarioMP),
                costoUnitarioEMP=VALUES(costoUnitarioEMP),
                costoUnitarioMUDI=VALUES(costoUnitarioMUDI),
                ultimoRegistroCambios=VALUES(ultimoRegistroCambios),
                fecha_revision=VALUES(fecha_revision)
        `, [
            id, nombre, estado, versionActual ?? 1, JSON.stringify(pasos || []), costoTotal ?? 0,
            esSemielaborado ? 1 : 0, tipoCosteo || 'GRAMO', mudi ?? 0, gif ?? 0,
            totalMP ?? 0, totalEMP ?? 0, totalMUDI ?? 0, costoTotalBase ?? 0, costoTotalFinal ?? 0,
            codigoCalidad ?? null,
            pesoTotalCantidad ?? null, pesoTotalUnidad ?? null, tiempoPrepCantidad ?? null, tiempoPrepUnidad ?? null,
            porcionesCantidad ?? null, porcionesUnidad ?? null, pesoPorcionCantidad ?? null, pesoPorcionUnidad ?? null,
            mermaCantidad ?? null, mermaUnidad ?? null, sumaTotalInsumos ?? 0, subsidiaria ?? null,
            elaboradoPor ?? null, aprobadoPor ?? null, areaProduce ?? null, areaEmpaca ?? null,
            flujoAprobacionId ?? null, costoUnitarioMP ?? 0, costoUnitarioEMP ?? 0, costoUnitarioMUDI ?? 0,
            ultimoRegistroCambios ?? null, fechaRevision ?? null
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
                i.costoUnitario ?? 0,
                i.costoTotal ?? 0,
                i.codigo ?? null,
                i.codigoNetSuite ?? null,
                i.descripcionIngrediente ?? null,
                i.tipoMaterial ?? null,
                i.snapshotCostoUnitario ?? null,
                i.snapshotVersion ?? null,
                i.marca ?? null,
                i.observaciones ?? null
            ]);

            await conn.query(`
                INSERT INTO ingredientes_receta (
                    id, receta_id, tipo, idReferencia, nombre, cantidad, unidad, 
                    costoUnitario, costoTotal, codigo, codigoNetSuite, 
                    descripcionIngrediente, tipoMaterial, 
                    snapshotCostoUnitario, snapshotVersion, marca, observaciones
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

async function eliminarReceta(id) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        // 1. Eliminar ingredientes asociados
        await conn.query("DELETE FROM ingredientes_receta WHERE receta_id = ?", [id]);
        
        // 2. Eliminar historial de versiones
        await conn.query("DELETE FROM historial_versiones WHERE receta_id = ?", [id]);
        
        // 3. Eliminar la receta
        const [result] = await conn.query("DELETE FROM recetas WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            throw new Error(`No se encontró la receta con ID ${id}`);
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

module.exports = { 
    obtenerInsumosLocales, 
    crearInsumoLocal, 
    obtenerRecetas, 
    upsertReceta, 
    guardarVersionHistorial,
    eliminarReceta 
};
