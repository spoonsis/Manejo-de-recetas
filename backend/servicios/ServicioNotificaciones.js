const pool = require("../config/database");

async function inicializarTablas() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rol_destino VARCHAR(50),
                titulo VARCHAR(255),
                mensaje TEXT,
                tipo VARCHAR(20) DEFAULT 'INFO',
                leida BOOLEAN DEFAULT FALSE,
                fecha DATETIME,
                referencia_id VARCHAR(50)
            )
        `);
        console.log("Tabla de Notificaciones verificada/creada.");
    } catch (e) {
        console.error("Error inicializando tabla de notificaciones", e);
    } finally {
        conn.release();
    }
}

inicializarTablas();

async function crearNotificacion(rolDestino, titulo, mensaje, tipo = 'INFO', referenciaId = null) {
    const [result] = await pool.query(`
        INSERT INTO notificaciones (rol_destino, titulo, mensaje, tipo, fecha, referencia_id, leida)
        VALUES (?, ?, ?, ?, NOW(), ?, FALSE)
    `, [rolDestino, titulo, mensaje, tipo, referenciaId]);
    return result.insertId;
}

async function obtenerNotificacionesPorRol(rol) {
    const [rows] = await pool.query(`
        SELECT * FROM notificaciones 
        WHERE rol_destino = ? OR rol_destino = 'TODOS'
        ORDER BY fecha DESC
        LIMIT 50
    `, [rol]);

    // Parse date to iso string for frontend
    return rows.map(r => ({
        ...r,
        fecha: new Date(r.fecha).toISOString(),
        leida: Boolean(r.leida)
    }));
}

async function marcarLeida(id) {
    await pool.query(`
        UPDATE notificaciones SET leida = TRUE WHERE id = ?
    `, [id]);
    return true;
}

module.exports = {
    crearNotificacion,
    obtenerNotificacionesPorRol,
    marcarLeida
};
