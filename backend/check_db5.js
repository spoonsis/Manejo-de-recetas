const { pool, poolConnect } = require('./config/externalDb');
const fs = require('fs');
async function check() {
    await poolConnect;
    const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
    const tables = result.recordset.map(r => r.TABLE_NAME);
    fs.writeFileSync('tables.txt', tables.join('\n'));
    console.log('Saved to tables.txt');
    process.exit(0);
}
check().catch(console.error);
