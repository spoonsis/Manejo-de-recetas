const pool = require('./config/database');

async function inspectTable() {
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM insumos");
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectTable();
