const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST_LOC,
            user: process.env.DB_USER_LOC,
            password: process.env.DB_PASSWORD_LOC,
            database: process.env.DB_NAME_LOC,
            port: process.env.DB_PORT_LOC,
        });
        const [rows] = await pool.query("SELECT id, nombreUsuario, rol, nombreCompleto FROM usuarios");
        console.log("Users:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
