const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require("../config/database");

const CONFIG_ROLES_INICIAL = [
  { rol: 'CHEF', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'GESTION_INSUMOS', 'FICHAS_TECNICAS', 'DESCARGA_MASIVA', 'DESCARGA_INDIVIDUAL'], color: 'bg-blue-500' },
  { rol: 'COSTOS', permisos: ['RECETAS_LECTURA', 'APROBAR_COSTOS', 'GESTION_INSUMOS'], color: 'bg-yellow-500' },
  { rol: 'MKT', permisos: ['RECETAS_LECTURA', 'APROBAR_MKT'], color: 'bg-orange-500' },
  { rol: 'CALIDAD', permisos: ['RECETAS_LECTURA', 'CERTIFICAR_CALIDAD', 'FICHAS_TECNICAS', 'GESTION_INSUMOS', 'DESCARGA_INDIVIDUAL'], color: 'bg-purple-500' },
  { rol: 'COMPRAS', permisos: ['GESTION_INSUMOS'], color: 'bg-emerald-500' },
  { rol: 'LOGISTICA', permisos: ['GESTION_INSUMOS'], color: 'bg-orange-500' },
  { rol: 'ADMIN', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS', 'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS', 'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS', 'DESCARGA_MASIVA', 'DESCARGA_INDIVIDUAL'], color: 'bg-slate-900' }
];

async function migrate() {
    try {
        console.log("Checking columns for table 'configuracion_roles'...");
        
        // 1. Verificar si la columna 'creadoPor' existe
        const [creadoPorCols] = await pool.query("SHOW COLUMNS FROM configuracion_roles LIKE 'creadoPor'");
        if (creadoPorCols.length === 0) {
            console.log("Adding column 'creadoPor' to 'configuracion_roles'...");
            await pool.query("ALTER TABLE configuracion_roles ADD COLUMN creadoPor VARCHAR(100) NULL");
            console.log("Column 'creadoPor' added successfully!");
        } else {
            console.log("Column 'creadoPor' already exists.");
        }

        // 2. Verificar si la columna 'fechaCreacion' existe
        const [fechaCreacionCols] = await pool.query("SHOW COLUMNS FROM configuracion_roles LIKE 'fechaCreacion'");
        if (fechaCreacionCols.length === 0) {
            console.log("Adding column 'fechaCreacion' to 'configuracion_roles'...");
            await pool.query("ALTER TABLE configuracion_roles ADD COLUMN fechaCreacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP");
            console.log("Column 'fechaCreacion' added successfully!");
        } else {
            console.log("Column 'fechaCreacion' already exists.");
        }

        // 3. Sembrar roles iniciales si la tabla está vacía o tiene registros nulos en creadoPor
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM configuracion_roles");
        const count = rows[0].count;
        console.log(`Current records in 'configuracion_roles': ${count}`);
        
        if (count === 0) {
            console.log("Seeding default roles config...");
            for (const r of CONFIG_ROLES_INICIAL) {
                await pool.query(
                    "INSERT INTO configuracion_roles (rol, permisos, color, creadoPor, fechaCreacion) VALUES (?, ?, ?, 'sistema', NOW())",
                    [r.rol, JSON.stringify(r.permisos), r.color]
                );
                console.log(`Seeded role: ${r.rol}`);
            }
            console.log("Seeding completed successfully!");
        } else {
            console.log("Table is not empty, updating system-default fields if null...");
            // Asegurarnos de que los roles por defecto tengan creadoPor y fechaCreacion si eran nulos
            await pool.query(
                "UPDATE configuracion_roles SET creadoPor = 'sistema', fechaCreacion = NOW() WHERE creadoPor IS NULL"
            );
        }

        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
