const pool = require('./config/database');

async function inspectTables() {
    try {
        const tables = ['recetas', 'ingredientes_receta', 'fichas_tecnicas'];
        const schema = {};
        for (const table of tables) {
            const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
            schema[table] = columns;
        }
        console.log(JSON.stringify(schema, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectTables();
