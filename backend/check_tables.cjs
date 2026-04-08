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
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('All tables present in DB:', tableNames.join(', '));
        
        for (const tName of tableNames) {
            if (tName.toLowerCase().includes('ficha')) {
                console.log(`\nFound table related to ficha: ${tName}`);
                const [cols] = await connection.query(`SHOW COLUMNS FROM ${tName}`);
                console.log(cols.map(c => c.Field).join(', '));
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

main();
