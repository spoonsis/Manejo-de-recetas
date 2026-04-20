const pool = require("./config/database");

async function dumpInsumos() {
    try {
        const [rows] = await pool.query("SELECT id, nombre, codigoBarras FROM insumos LIMIT 10");
        console.log("Muestra de Insumos:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

dumpInsumos();
