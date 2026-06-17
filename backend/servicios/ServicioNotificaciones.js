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

        await conn.query(`
            CREATE TABLE IF NOT EXISTS notificaciones_leidas (
                usuario_id VARCHAR(50),
                notificacion_id INT,
                PRIMARY KEY (usuario_id, notificacion_id)
            )
        `);
        console.log("Tabla de Notificaciones Leídas verificada/creada.");
    } catch (e) {
        console.error("Error inicializando tablas de notificaciones", e);
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

async function obtenerNotificacionesPorRol(rol, usuarioId) {
    const [rows] = await pool.query(`
        SELECT n.*, (nl.usuario_id IS NOT NULL) AS leida 
        FROM notificaciones n
        LEFT JOIN notificaciones_leidas nl 
            ON n.id = nl.notificacion_id AND nl.usuario_id = ?
        WHERE n.rol_destino = ? OR n.rol_destino = 'TODOS'
        ORDER BY n.fecha DESC
        LIMIT 50
    `, [usuarioId || '', rol]);

    // Parse date to iso string for frontend
    return rows.map(r => ({
        ...r,
        fecha: new Date(r.fecha).toISOString(),
        leida: Boolean(r.leida)
    }));
}

async function marcarLeida(id, usuarioId) {
    await pool.query(`
        INSERT IGNORE INTO notificaciones_leidas (usuario_id, notificacion_id)
        VALUES (?, ?)
    `, [usuarioId || '', id]);
    return true;
}

async function marcarTodasLeidas(rol, usuarioId) {
    await pool.query(`
        INSERT IGNORE INTO notificaciones_leidas (usuario_id, notificacion_id)
        SELECT ?, id FROM notificaciones 
        WHERE rol_destino = ? OR rol_destino = 'TODOS'
    `, [usuarioId || '', rol]);
    return true;
}

module.exports = {
    crearNotificacion,
    obtenerNotificacionesPorRol,
    marcarLeida,
    marcarTodasLeidas
};
