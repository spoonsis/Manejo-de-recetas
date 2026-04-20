const pool = require("./config/database");

async function checkIds() {
    try {
        const [rows] = await pool.query("SELECT id FROM insumos LIMIT 20");
        console.log("IDs en tabla insumos:");
        console.log(rows.map(r => r.id));
        
        const [rows2] = await pool.query("SELECT idReferencia FROM ingredientes_receta LIMIT 20");
        console.log("\nIDs de referencia en ingredientes_receta:");
        console.log(rows2.map(r => r.idReferencia));
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkIds();
