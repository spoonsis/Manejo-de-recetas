const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST_LOC,
        user: process.env.DB_USER_LOC,
        password: process.env.DB_PASSWORD_LOC,
        database: process.env.DB_NAME_LOC,
        port: process.env.DB_PORT_LOC
    });

    try {
        await pool.query('ALTER TABLE insumos ADD COLUMN tipoUnidad VARCHAR(100), ADD COLUMN unidadBase VARCHAR(100), ADD COLUMN tipoRotacion VARCHAR(100), ADD COLUMN ciTipoArticulo VARCHAR(100), ADD COLUMN metodoCalculo VARCHAR(100), ADD COLUMN categoriaCosto VARCHAR(100), ADD COLUMN tipoEstimacion VARCHAR(100), ADD COLUMN programaFiscal VARCHAR(100);');
        console.log('Columns added successfully');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
