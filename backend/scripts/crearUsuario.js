const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const password = process.argv[2];
const username = process.argv[3];
const email = process.argv[4] || `${username}@example.com`;
const rol = process.argv[5] || 'CHEF';

if (!password || !username) {
    console.log('Uso: node crearUsuario.js <password> <username> [email] [rol]');
    process.exit(1);
}

async function crear() {
    try {
        const hash = await bcrypt.hash(password, 10);
        console.log(`Generando hash para "${username}"...`);
        console.log(`Hash: ${hash}`);

        const [result] = await pool.query(
            'INSERT INTO usuarios (id, nombreUsuario, email, passwordHash, rol, activo, nombreCompleto) VALUES (?, ?, ?, ?, ?, 1, ?)',
            [username, username, email, hash, rol, username]
        );

        console.log('✅ Usuario creado exitosamente en la base de datos.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

crear();
