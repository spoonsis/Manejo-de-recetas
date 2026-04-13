const mysql = require("mysql2/promise");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST_LOC,
        user: process.env.DB_USER_LOC,
        password: process.env.DB_PASSWORD_LOC,
        database: process.env.DB_NAME_LOC,
        port: process.env.DB_PORT_LOC,
    });

    try {
        console.log("Checking structure of 'insumos' table...");
        const [columns] = await pool.query("DESCRIBE insumos");
        const localesCol = columns.find(c => c.Field === 'locales');
        console.log("Column 'locales' structure:", localesCol);

        if (localesCol.Type.includes('tinyint')) {
             console.log("ALERT: Column is still TINYINT. Attempting migration again...");
             await pool.query("ALTER TABLE insumos MODIFY COLUMN locales VARCHAR(10)");
             console.log("Migration re-attempted.");
        }

        const [rows] = await pool.query("SELECT id, nombre, locales FROM insumos WHERE nombre LIKE '%Leche condensada%'");
        console.log("Current data for Leche condensada:", rows);

        process.exit(0);
    } catch (e) {
        console.error("Check failed:", e);
        process.exit(1);
    }
}
check();
