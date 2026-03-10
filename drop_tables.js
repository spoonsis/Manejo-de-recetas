const pool = require("./backend/config/database");

async function resetTables() {
    const conn = await pool.getConnection();
    try {
        await conn.query("DROP TABLE IF EXISTS fichas_tecnicas_historial");
        await conn.query("DROP TABLE IF EXISTS fichas_tecnicas");
        console.log("Tablas antiguas eliminadas.");
    } catch (e) {
        console.error(e);
    } finally {
        conn.release();
        process.exit(0);
    }
}

resetTables();
