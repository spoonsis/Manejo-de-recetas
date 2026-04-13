const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000
    }
};

async function test() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);
        console.log("Connected!");
        const res = await pool.request().query("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Vendor'");
        console.log("Vendor table count:", res.recordset[0].cnt);
        if (res.recordset[0].cnt > 0) {
            const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Vendor'");
            console.log("Columns in Vendor:", cols.recordset.map(c => c.COLUMN_NAME));
        }
        await sql.close();
    } catch (error) {
        console.error("FAIL:", error.message);
    }
}
test();
