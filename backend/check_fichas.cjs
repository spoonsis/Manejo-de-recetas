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
        const [rows] = await connection.query("SHOW TABLES LIKE 'fichas_tecnicas'");
        if (rows.length === 0) {
            console.log('Table fichas_tecnicas DOES NOT EXIST!');
        } else {
            const [cols] = await connection.query("SHOW COLUMNS FROM fichas_tecnicas");
            console.log('Columns in fichas_tecnicas:', cols.map(c => c.Field + ' (' + c.Type + ')').join(', '));
        }

        const [tables] = await connection.query("SHOW TABLES");
        console.log('All tables:', tables.map(t => Object.values(t)[0]).join(', '));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

main();
