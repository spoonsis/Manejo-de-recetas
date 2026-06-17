const pool = require("../config/database");

async function migrate() {
    try {
        console.log("Checking if 'fechaImpresion' column exists in 'recetas' table...");
        const [columns] = await pool.query("SHOW COLUMNS FROM recetas LIKE 'fechaImpresion'");
        if (columns.length === 0) {
            console.log("Adding 'fechaImpresion' column to 'recetas' table...");
            await pool.query("ALTER TABLE recetas ADD COLUMN fechaImpresion DATETIME NULL");
            console.log("Column 'fechaImpresion' added successfully!");
        } else {
            console.log("Column 'fechaImpresion' already exists.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
