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
        console.log('Adding declaracionIngredientes to fichas_tecnicas...');
        await connection.query("ALTER TABLE fichas_tecnicas ADD COLUMN declaracionIngredientes TEXT;");
        console.log('Column added successfully.');
    } catch (err) {
        if(err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, proceeding.');
        } else {
            console.error('Error modifying database:', err);
        }
    } finally {
        await connection.end();
    }
}

main();
