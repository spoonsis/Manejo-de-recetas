const mysql = require("mysql2/promise");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fix() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST_LOC,
        user: process.env.DB_USER_LOC,
        password: process.env.DB_PASSWORD_LOC,
        database: process.env.DB_NAME_LOC,
        port: process.env.DB_PORT_LOC,
    });

    try {
        console.log("🔍 Cargando recetas de la base de datos...");
        const [recipes] = await pool.query(
            "SELECT id, nombre, codigoCalidad, codigo_netsuite, esSemielaborado, flujo_aprobacion_id, detalle_nombre_receta FROM recetas"
        );
        console.log(`Loaded ${recipes.length} recipes.`);

        let updatedCount = 0;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const r of recipes) {
                let finalNS = r.codigo_netsuite || "";
                let esSemi = r.esSemielaborado === 1;
                let flujoId = r.flujo_aprobacion_id;

                const textToSearch = `${r.detalle_nombre_receta || ''} ${r.nombre || ''} ${finalNS}`;
                const nsMatch = textToSearch.match(/(SE\d+|PTI\d+|PTL\d+)/i);

                if (nsMatch) {
                    finalNS = nsMatch[1].toUpperCase();
                    if (finalNS.startsWith('SE')) {
                        esSemi = true;
                        flujoId = 'f_semielaborado';
                    }
                }

                // Regenerar detalle_nombre_receta
                const partCalidad = (r.codigoCalidad || '').trim();
                const partNombre = (r.nombre || '').trim();
                const partNS = finalNS.trim();
                const newDetalle = `${partCalidad} ${partNombre} ${partNS}`.replace(/\s+/g, ' ').trim();

                const needsUpdate = 
                    finalNS !== r.codigo_netsuite ||
                    esSemi !== (r.esSemielaborado === 1) ||
                    flujoId !== r.flujo_aprobacion_id ||
                    newDetalle !== r.detalle_nombre_receta;

                if (needsUpdate) {
                    console.log(`Updating recipe "${r.nombre}" (${r.id}):`);
                    if (finalNS !== r.codigo_netsuite) console.log(`  - Code: "${r.codigo_netsuite}" -> "${finalNS}"`);
                    if (esSemi !== (r.esSemielaborado === 1)) console.log(`  - Semielaborado: ${r.esSemielaborado === 1} -> ${esSemi}`);
                    if (flujoId !== r.flujo_aprobacion_id) console.log(`  - Flujo: "${r.flujo_aprobacion_id}" -> "${flujoId}"`);
                    if (newDetalle !== r.detalle_nombre_receta) console.log(`  - Detalle: "${r.detalle_nombre_receta}" -> "${newDetalle}"`);

                    await connection.query(
                        `UPDATE recetas 
                         SET codigo_netsuite = ?, esSemielaborado = ?, flujo_aprobacion_id = ?, detalle_nombre_receta = ?
                         WHERE id = ?`,
                        [finalNS, esSemi ? 1 : 0, flujoId, newDetalle, r.id]
                    );
                    updatedCount++;
                }
            }

            await connection.commit();
            console.log(`\n🎉 ¡Base de datos reparada con éxito!`);
            console.log(`- Total recetas corregidas/actualizadas: ${updatedCount}`);

        } catch (dbErr) {
            await connection.rollback();
            console.error("Database Error during updates:", dbErr);
        } finally {
            connection.release();
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
