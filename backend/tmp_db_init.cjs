const path = require('path');
// Al estar en la carpeta backend, .env está en el mismo nivel
require('dotenv').config(); 
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST_LOC,
    user: process.env.DB_USER_LOC,
    password: process.env.DB_PASSWORD_LOC,
    database: process.env.DB_NAME_LOC,
    port: process.env.DB_PORT_LOC,
    waitForConnections: true,
    connectionLimit: 10,
});

async function check() {
    try {
        console.log("Checking MySQL connection...");
        console.log("DB Config:", {
            host: process.env.DB_HOST_LOC,
            user: process.env.DB_USER_LOC,
            database: process.env.DB_NAME_LOC
        });

        const [rows] = await pool.query("SHOW TABLES LIKE 'maestro_areas'");
        if (rows.length === 0) {
            console.log("Table 'maestro_areas' does NOT exist. Creating it...");
            await pool.query(`
                CREATE TABLE IF NOT EXISTS maestro_areas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(150) UNIQUE NOT NULL
                )
            `);
            console.log("Table created.");
            
            // Insertar iniciales
            const areasIniciales = ["Decoración", "Cocina", "Batidos", "Postres", "Pastas", "Empaque"];
            for (const area of areasIniciales) {
                await pool.query("INSERT IGNORE INTO maestro_areas (nombre) VALUES (?)", [area]);
            }
            console.log("Seed data inserted.");

        } else {
            console.log("Table 'maestro_areas' already exists.");
        }
        
        const [finalRows] = await pool.query("SELECT * FROM maestro_areas");
        console.log("Current areas in DB:", finalRows);
        
        process.exit(0);
    } catch (e) {
        console.error("Error during DB initialization:", e);
        process.exit(1);
    }
}
check();
