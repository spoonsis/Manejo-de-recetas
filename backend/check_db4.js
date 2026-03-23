const { pool, poolConnect } = require('./config/externalDb');
async function check() {
    await poolConnect;
    const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
    console.dir(result.recordset.map(r => r.TABLE_NAME), { maxArrayLength: null });
    process.exit(0);
}
check().catch(console.error);
