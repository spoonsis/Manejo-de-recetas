const pool = require('./backend/config/database');

async function test() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM recetas;');
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
