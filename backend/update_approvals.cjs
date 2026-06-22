const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pool = require('./config/database');

const PREVIEW_FILE = path.join(__dirname, 'Revision_Recetas_Masivo.xlsx');

async function updateApprovals() {
    try {
        console.log("🚀 Iniciando Actualización Segura de Aprobadores y Códigos...");

        if (!fs.existsSync(PREVIEW_FILE)) {
            console.error(`❌ No se encontró el archivo de revisión: ${PREVIEW_FILE}`);
            console.error("Por favor, ejecuta primero: node generar_preview.cjs");
            process.exit(1);
        }

        // 1. Cargar datos del Excel
        console.log(`📥 Leyendo reporte masivo: ${PREVIEW_FILE}...`);
        const workbook = XLSX.readFile(PREVIEW_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`✅ ${rows.length} recetas cargadas desde el Excel.`);

        let updatedCount = 0;
        let notFoundCount = 0;

        // 2. Procesar cada fila
        for (const row of rows) {
            const fileCode = row["Código Calidad (Receta)"];
            const aprobadoPor = row["Aprobado Por"] ? String(row["Aprobado Por"]).trim() : null;
            const codigoNetsuite = row["Código NetSuite (Receta)"] ? String(row["Código NetSuite (Receta)"]).trim() : "";
            const archivo = row["Archivo Original"];

            if (!fileCode) {
                console.warn(`⚠️ Fila omitida (sin código calidad de archivo): ${archivo}`);
                continue;
            }

            // Buscar receta por codigoCalidad en la DB
            const [recipes] = await pool.query(
                "SELECT id, nombre, codigoCalidad, codigo_netsuite FROM recetas WHERE codigoCalidad = ?", 
                [fileCode]
            );

            if (recipes.length === 0) {
                notFoundCount++;
                // Opcional: registrar que no se encontró en la BD
                continue;
            }

            // Para cada receta encontrada
            for (const recipe of recipes) {
                // Calcular el nuevo detalle_nombre_receta
                const partCalidad = (recipe.codigoCalidad || '').trim();
                const partNombre = (recipe.nombre || '').trim();
                const partNS = codigoNetsuite.trim();
                const newDetalle = `${partCalidad} ${partNombre} ${partNS}`.replace(/\s+/g, ' ').trim();

                // Actualizar DB
                await pool.query(
                    `UPDATE recetas 
                     SET aprobadoPor = ?, codigo_netsuite = ?, detalle_nombre_receta = ? 
                     WHERE id = ?`,
                    [aprobadoPor, codigoNetsuite, newDetalle, recipe.id]
                );

                console.log(`✅ Actualizado: [${recipe.codigoCalidad}] ${recipe.nombre} -> Aprobado por: ${aprobadoPor} | Código NS: ${codigoNetsuite}`);
                updatedCount++;
            }
        }

        console.log(`\n✨ Proceso de actualización masiva terminado.`);
        console.log(`📊 Resumen:`);
        console.log(` - Recetas actualizadas con éxito: ${updatedCount}`);
        console.log(` - Recetas del Excel no encontradas en DB: ${notFoundCount}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error en la actualización masiva:", error);
        process.exit(1);
    }
}

updateApprovals();
