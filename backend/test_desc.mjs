import fs from 'fs';
import mysql from 'mysql2/promise';

import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await pool.query('DESCRIBE recetas');
  fs.writeFileSync('debug_schema.json', JSON.stringify(rows, null, 2));
  process.exit(0);
}

run().catch(console.error);
