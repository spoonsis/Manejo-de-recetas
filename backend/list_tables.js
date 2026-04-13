const { pool, poolConnect } = require('./config/externalDb');

async function test() {
    try {
        await poolConnect;
        console.log("Connected. Listing tables...");
        const result = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        console.log("Tables found:", result.recordset.length);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

test();
