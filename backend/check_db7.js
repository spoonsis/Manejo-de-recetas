const { pool, poolConnect } = require('./config/externalDb');
async function check() {
    await poolConnect;
    const result = await pool.request().query('SELECT TOP 3 * FROM l_nt_dim_articulo');
    console.dir(result.recordset[0]);
    process.exit(0);
}
check().catch(console.error);
