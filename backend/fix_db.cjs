const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST_LOC || 'localhost',
        user: process.env.DB_USER_LOC || 'root',
        password: process.env.DB_PASSWORD_LOC || '123456',
        database: process.env.DB_NAME_LOC || 'gastroflow_pro'
    });

    try {
        console.log('Connected to database.');
        
        // Let's first check what type it is
        const [rows] = await connection.query("SHOW COLUMNS FROM ingredientes_receta WHERE Field = 'tipo'");
        console.log('Current column type:', rows[0].Type);

        // Modify the column safely
        // Just make it a standard VARCHAR(20) to comfortably hold 'SEMIELABORADO'
        await connection.query("ALTER TABLE ingredientes_receta MODIFY COLUMN tipo VARCHAR(20)");
        console.log('Column modified successfully. New type: VARCHAR(20)');
    } catch (err) {
        console.error('Error modifying database:', err);
    } finally {
        await connection.end();
    }
}

main();
