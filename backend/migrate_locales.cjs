const mysql = require("mysql2/promise");
const path = require('path');
// Cargar .env desde la carpeta backend específicamente
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST_LOC,
    user: process.env.DB_USER_LOC,
    password: process.env.DB_PASSWORD_LOC,
    database: process.env.DB_NAME_LOC,
    port: process.env.DB_PORT_LOC,
});

async function migrate() {
    try {
        console.log("Migrating 'locales' column in 'insumos' table...");
        
        // 1. Asegurar VARCHAR
        await pool.query("ALTER TABLE insumos MODIFY COLUMN locales VARCHAR(10)");
        
        // 2. Convertir 1 -> Si, 0 -> No (Solo si son exactamente '1' o '0')
        await pool.query("UPDATE insumos SET locales = 'Si' WHERE locales = '1'");
        await pool.query("UPDATE insumos SET locales = 'No' WHERE locales = '0' OR locales IS NULL OR locales = ''");
        
        console.log("Existing data migrated.");
        
        const [rows] = await pool.query("SELECT id, nombre, locales FROM insumos WHERE nombre LIKE '%Leche condensada%'");
        console.log("Leche condensada after fix:", rows);

        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}
migrate();
