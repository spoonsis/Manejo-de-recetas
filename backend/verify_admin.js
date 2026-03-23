const pool = require("./config/database");
const bcrypt = require("bcryptjs");

async function verify() {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE nombreUsuario = 'admin'");
        console.log("Admin User found:", rows.length > 0);
        if (rows.length > 0) {
            const user = rows[0];
            console.log("User:", { id: user.id, username: user.nombreUsuario, rol: user.rol, activo: user.activo });
            const match = await bcrypt.compare("adminpass", user.passwordHash);
            console.log("Password Match (adminpass):", match);
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

verify();
