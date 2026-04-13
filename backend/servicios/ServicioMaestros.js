const pool = require("../config/database");

/**
 * Inicializa la tabla de áreas si no existe.
 */
async function inicializarTablas() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS maestro_areas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(150) UNIQUE NOT NULL
        )
    `);

    // Insertar áreas iniciales si la tabla está vacía
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM maestro_areas");
    if (rows[0].count === 0) {
        const areasIniciales = ["Decoración", "Cocina", "Batidos", "Postres", "Pastas", "Empaque"];
        for (const area of areasIniciales) {
            await pool.query("INSERT IGNORE INTO maestro_areas (nombre) VALUES (?)", [area]);
        }
        console.log("✅ Áreas maestro inicializadas");
    }
}

async function obtenerAreas() {
    const [rows] = await pool.query("SELECT * FROM maestro_areas ORDER BY nombre");
    return rows;
}

async function guardarArea(nombre) {
    if (!nombre) throw new Error("El nombre de la área es requerido");
    await pool.query("INSERT INTO maestro_areas (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)", [nombre]);
    return { success: true };
}

async function eliminarArea(id) {
    await pool.query("DELETE FROM maestro_areas WHERE id = ?", [id]);
    return { success: true };
}

async function editarArea(id, nuevoNombre) {
    await pool.query("UPDATE maestro_areas SET nombre = ? WHERE id = ?", [nuevoNombre, id]);
    return { success: true };
}

// Inicializar al cargar el módulo
inicializarTablas().catch(err => console.error("Error inicializando maestro_areas:", err));

module.exports = {
    obtenerAreas,
    guardarArea,
    eliminarArea,
    editarArea
};
