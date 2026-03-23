const { pool, poolConnect } = require('./config/externalDb');
async function check() {
    await poolConnect;
    const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%component%' OR TABLE_NAME LIKE '%receta%' OR TABLE_NAME LIKE '%ingrediente%'");
    console.log(result.recordset);
    process.exit(0);
}
check().catch(console.error);
