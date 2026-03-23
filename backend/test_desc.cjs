const fs = require('fs');
require('dotenv').config();
const pool = require('./config/database.js');

async function run() {
  try {
    const [rows] = await pool.query('DESCRIBE recetas');
    fs.writeFileSync('debug_schema.json', JSON.stringify(rows, null, 2));
    console.log('Success');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
