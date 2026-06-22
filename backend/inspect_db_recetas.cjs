const pool = require('./config/database');

async function inspectRecetas() {
    try {
        const [rows] = await pool.query("SELECT id, nombre, nombre_receta, codigo_netsuite, codigoCalidad, aprobadoPor, elaboradoPor FROM recetas LIMIT 10");
        console.log("Existing Recipes in DB (limit 10):");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectRecetas();
