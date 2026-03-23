const pool = require('../config/database');

async function obtenerFlujos() {
    const [flujos] = await pool.query('SELECT * FROM flujos_aprobacion');
    const [pasos] = await pool.query('SELECT * FROM pasos_flujo ORDER BY orden ASC');

    return flujos.map(f => ({
        ...f,
        activo: Boolean(f.activo),
        pasos: pasos.filter(p => p.flujo_id === f.id)
    }));
}

async function upsertFlujo(flujo) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Upsert Flujo
        await conn.query(`
            INSERT INTO flujos_aprobacion (id, nombre, descripcion, activo)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nombre=VALUES(nombre), 
                descripcion=VALUES(descripcion), 
                activo=VALUES(activo)
        `, [flujo.id, flujo.nombre, flujo.descripcion, flujo.activo ? 1 : 0]);

        // 2. Manejar Pasos
        // Primero eliminar los que no están en la lista actual
        const idsPasosActuales = flujo.pasos.filter(p => p.id).map(p => p.id);
        if (idsPasosActuales.length > 0) {
            await conn.query('DELETE FROM pasos_flujo WHERE flujo_id = ? AND id NOT IN (?)', [flujo.id, idsPasosActuales]);
        } else {
            await conn.query('DELETE FROM pasos_flujo WHERE flujo_id = ?', [flujo.id]);
        }

        // Insertar o actualizar pasos
        for (const p of flujo.pasos) {
            await conn.query(`
                INSERT INTO pasos_flujo (id, flujo_id, orden, rolResponsable, accionRequerida, estadoDestino, etiqueta)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    orden=VALUES(orden),
                    rolResponsable=VALUES(rolResponsable),
                    accionRequerida=VALUES(accionRequerida),
                    estadoDestino=VALUES(estadoDestino),
                    etiqueta=VALUES(etiqueta)
            `, [p.id, flujo.id, p.orden, p.rolResponsable, p.accionRequerida, p.estadoDestino, p.etiqueta]);
        }

        await conn.commit();
        return { success: true };
    } catch (error) {
        await conn.rollback();
        console.error('Error in upsertFlujo:', error);
        throw error;
    } finally {
        conn.release();
    }
}

async function eliminarFlujo(id) {
    // Los pasos se eliminan por cascada si está configurado en la DB, 
    // pero lo hacemos manual por seguridad si no lo está.
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM pasos_flujo WHERE flujo_id = ?', [id]);
        await conn.query('DELETE FROM flujos_aprobacion WHERE id = ?', [id]);
        await conn.commit();
        return { success: true };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    obtenerFlujos,
    upsertFlujo,
    eliminarFlujo
};
