const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST_LOC,
    user: process.env.DB_USER_LOC,
    password: process.env.DB_PASSWORD_LOC,
    database: process.env.DB_NAME_LOC,
    port: process.env.DB_PORT_LOC,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;