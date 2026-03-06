// backend/config/externalDb.js
require('dotenv').config(); // cargar variables de entorno
const sql = require('mssql');

// Configuración de conexión a Azure SQL
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,       // debe ser un string, ej: "mi-servidor.database.windows.net"
    database: process.env.DB_DATABASE,
    port: 1433, // 1433 por defecto si no está en .env
    options: {
        encrypt: true,                   // obligatorio para Azure
        trustServerCertificate: false    // cambia a true solo para desarrollo local si da problemas
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Verificación rápida de variables de entorno
console.log("Conectando a Azure SQL con estos datos:");


// Crear pool de conexiones
const pool = new sql.ConnectionPool(config);

// Conectar al pool con manejo de errores
const poolConnect = pool.connect()
    .then(() => console.log("Conectado a Azure SQL 🎉"))
    .catch(err => console.error("Error conexión Azure:", err));

module.exports = {
    sql,
    pool,
    poolConnect
};