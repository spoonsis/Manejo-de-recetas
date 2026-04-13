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
        trustServerCertificate: true
    }
};

async function test() {
    try {
        console.log("Connecting to:", config.server, "DB:", config.database);
        const pool = await sql.connect(config);
        console.log("Connected!");
        
        console.log("Testing [dbo].[Vendor]...");
        try {
            const result = await pool.request().query('SELECT TOP 1 entitytitle FROM [dbo].[Vendor]');
            console.log("Success with [dbo].[Vendor]:", result.recordset);
        } catch (e1) {
            console.log("Failed [dbo].[Vendor]:", e1.message);
            
            console.log("Testing Vendor (no schema)...");
            try {
                const result = await pool.request().query('SELECT TOP 1 entitytitle FROM Vendor');
                console.log("Success with Vendor:", result.recordset);
            } catch (e2) {
                console.log("Failed Vendor:", e2.message);
            }
        }
        
        await sql.close();
    } catch (error) {
        console.error("Connection Error:", error);
    }
}

test();
