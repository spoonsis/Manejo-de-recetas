const pool = require("../config/database");

async function inicializarTablas() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS fichas_tecnicas (
                id VARCHAR(50) PRIMARY KEY,
                recetaId VARCHAR(50),
                nombreReceta VARCHAR(255),
                codigoCalidadPropio VARCHAR(100),
                estado VARCHAR(50),
                version INT DEFAULT 1,
                
                subsidiaria VARCHAR(255),
                elaboradoPor VARCHAR(255),
                aprobadoPor VARCHAR(255),
                areaProduce VARCHAR(255),
                areaEmpaca VARCHAR(255),
                
                descripcionTecnica TEXT,
                alergenos JSON,
                usoIntencional TEXT,
                consumidorObjetivo TEXT,
                restricciones TEXT,
                empaque VARCHAR(255),
                almacenamientoInterno TEXT,
                transporte TEXT,
                aspectoRechazo TEXT,
                almacenamientoPuntoVenta TEXT,
                vidaUtilCongelado VARCHAR(100),
                vidaUtilRefrigerado VARCHAR(100),
                vidaUtilAmbiente VARCHAR(100),
                pesoBruto VARCHAR(100),
                pesoNeto VARCHAR(100),
                pesoEtiqueta VARCHAR(100),
                requiereEtiquetaIngredientes BOOLEAN DEFAULT FALSE,
                registroMS VARCHAR(100),
                codigoBarras VARCHAR(100),
                comentariosCalidad TEXT,
                
                fisicas JSON,
                organolepticas JSON,
                aspectosMicrobiologicos JSON,
                imagenes JSON,
                requisitosLegales TEXT,
                
                fechaCreacion DATETIME,
                ultimaModificacion DATETIME
            )
        `);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS fichas_tecnicas_historial (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ficha_id VARCHAR(50),
                fecha DATETIME,
                usuario VARCHAR(100),
                descripcion TEXT,
                version INT,
                FOREIGN KEY (ficha_id) REFERENCES fichas_tecnicas(id) ON DELETE CASCADE
            )
        `);
        console.log("Tablas de Ficha Técnica verificadas/creadas.");
    } catch (e) {
        console.error("Error inicializando tablas de fichas técnicas", e);
    } finally {
        conn.release();
    }
}

inicializarTablas();

async function obtenerFichas() {
    const [fichas] = await pool.query("SELECT * FROM fichas_tecnicas");
    const [historial] = await pool.query("SELECT * FROM fichas_tecnicas_historial");

    return fichas.map(f => {
        // Parsear JSONs
        ['alergenos', 'fisicas', 'organolepticas', 'aspectosMicrobiologicos', 'imagenes'].forEach(campo => {
            if (typeof f[campo] === 'string') {
                try {
                    f[campo] = JSON.parse(f[campo]);
                } catch (e) {
                    f[campo] = (campo === 'alergenos' || campo === 'aspectosMicrobiologicos' || campo === 'imagenes') ? [] : {};
                }
            } else if (!f[campo]) {
                f[campo] = (campo === 'alergenos' || campo === 'aspectosMicrobiologicos' || campo === 'imagenes') ? [] : {};
            }

            // Boolean parsing for tinyint
            if (campo === 'requiereEtiquetaIngredientes') {
                f[campo] = f[campo] === 1;
            }
        });

        // Asegurar que requieren booleanos sean booleanos reales
        f.requiereEtiquetaIngredientes = Boolean(f.requiereEtiquetaIngredientes);

        f.historialCambios = historial.filter(h => h.ficha_id === f.id).map(h => ({
            fecha: new Date(h.fecha).toLocaleString(),
            usuario: h.usuario,
            descripcion: h.descripcion,
            version: h.version
        }));

        // Convertir DATETIME string de mysql a localestring
        if (f.fechaCreacion) f.fechaCreacion = new Date(f.fechaCreacion).toLocaleString();
        if (f.ultimaModificacion) f.ultimaModificacion = new Date(f.ultimaModificacion).toLocaleString();

        return f;
    });
}

async function upsertFicha(datos) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            id, recetaId, nombreReceta, codigoCalidadPropio, estado, version,
            subsidiaria, elaboradoPor, aprobadoPor, areaProduce, areaEmpaca,
            descripcionTecnica, declaracionIngredientes, alergenos, usoIntencional, consumidorObjetivo,
            restricciones, empaque, almacenamientoInterno, transporte, aspectoRechazo,
            almacenamientoPuntoVenta, vidaUtilCongelado, vidaUtilRefrigerado, vidaUtilAmbiente,
            pesoBruto, pesoNeto, pesoEtiqueta, requiereEtiquetaIngredientes,
            registroMS, codigoBarras, comentariosCalidad,
            fisicas, organolepticas, aspectosMicrobiologicos, imagenes, requisitosLegales,
            historialCambios // Array que viene del front
        } = datos;

        await conn.query(`
            INSERT INTO fichas_tecnicas (
                id, recetaId, nombreReceta, codigoCalidadPropio, estado, version,
                subsidiaria, elaboradoPor, aprobadoPor, areaProduce, areaEmpaca,
                descripcionTecnica, declaracionIngredientes, alergenos, usoIntencional, consumidorObjetivo,
                restricciones, empaque, almacenamientoInterno, transporte, aspectoRechazo,
                almacenamientoPuntoVenta, vidaUtilCongelado, vidaUtilRefrigerado, vidaUtilAmbiente,
                pesoBruto, pesoNeto, pesoEtiqueta, requiereEtiquetaIngredientes,
                registroMS, codigoBarras, comentariosCalidad,
                fisicas, organolepticas, aspectosMicrobiologicos, imagenes, requisitosLegales,
                fechaCreacion, ultimaModificacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                recetaId=VALUES(recetaId), nombreReceta=VALUES(nombreReceta), codigoCalidadPropio=VALUES(codigoCalidadPropio), 
                estado=VALUES(estado), version=VALUES(version), subsidiaria=VALUES(subsidiaria), elaboradoPor=VALUES(elaboradoPor), 
                aprobadoPor=VALUES(aprobadoPor), areaProduce=VALUES(areaProduce), areaEmpaca=VALUES(areaEmpaca),
                descripcionTecnica=VALUES(descripcionTecnica), declaracionIngredientes=VALUES(declaracionIngredientes), alergenos=VALUES(alergenos), usoIntencional=VALUES(usoIntencional), 
                consumidorObjetivo=VALUES(consumidorObjetivo), restricciones=VALUES(restricciones), empaque=VALUES(empaque), 
                almacenamientoInterno=VALUES(almacenamientoInterno), transporte=VALUES(transporte), aspectoRechazo=VALUES(aspectoRechazo),
                almacenamientoPuntoVenta=VALUES(almacenamientoPuntoVenta), vidaUtilCongelado=VALUES(vidaUtilCongelado), 
                vidaUtilRefrigerado=VALUES(vidaUtilRefrigerado), vidaUtilAmbiente=VALUES(vidaUtilAmbiente),
                pesoBruto=VALUES(pesoBruto), pesoNeto=VALUES(pesoNeto), pesoEtiqueta=VALUES(pesoEtiqueta), 
                requiereEtiquetaIngredientes=VALUES(requiereEtiquetaIngredientes), registroMS=VALUES(registroMS), 
                codigoBarras=VALUES(codigoBarras), comentariosCalidad=VALUES(comentariosCalidad),
                fisicas=VALUES(fisicas), organolepticas=VALUES(organolepticas), aspectosMicrobiologicos=VALUES(aspectosMicrobiologicos), 
                imagenes=VALUES(imagenes), requisitosLegales=VALUES(requisitosLegales),
                ultimaModificacion=NOW()
        `, [
            id, recetaId, nombreReceta, codigoCalidadPropio || '', estado, version || 1,
            subsidiaria || '', elaboradoPor || '', aprobadoPor || '', areaProduce || '', areaEmpaca || '',
            descripcionTecnica || '', declaracionIngredientes || '', JSON.stringify(alergenos || []), usoIntencional || '', consumidorObjetivo || '',
            restricciones || '', empaque || '', almacenamientoInterno || '', transporte || '', aspectoRechazo || '',
            almacenamientoPuntoVenta || '', vidaUtilCongelado || '', vidaUtilRefrigerado || '', vidaUtilAmbiente || '',
            pesoBruto || '', pesoNeto || '', pesoEtiqueta || '', requiereEtiquetaIngredientes ? 1 : 0,
            registroMS || '', codigoBarras || '', comentariosCalidad || '',
            JSON.stringify(fisicas || {}), JSON.stringify(organolepticas || {}), JSON.stringify(aspectosMicrobiologicos || []),
            JSON.stringify(imagenes || []), requisitosLegales || ''
        ]);

        // Reconstruir el historial desde cero cada vez es más fácil para mantener sincronizado con el front-end,
        // o podemos simplemente insertar los nuevos. Para asegurar integridad, borramos y reinsertamos.
        await conn.query(`DELETE FROM fichas_tecnicas_historial WHERE ficha_id = ?`, [id]);

        if (historialCambios && historialCambios.length > 0) {
            const histValues = historialCambios.map(h => {
                // Parse date if it's a valid localestring
                let d = new Date(h.fecha);
                if (isNaN(d.getTime())) {
                    // Si falla el parseo, intentar formatearlo si es string, o usar NOW
                    d = new Date(); // fallback
                }

                return [
                    id, d, h.usuario || '', h.descripcion || '', h.version || 1
                ];
            });

            await conn.query(`
                INSERT INTO fichas_tecnicas_historial (
                    ficha_id, fecha, usuario, descripcion, version
                ) VALUES ?
            `, [histValues]);
        }

        await conn.commit();
        return true;
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

module.exports = {
    obtenerFichas,
    upsertFicha
};
