const pool = require("./config/database");

async function migrate() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        console.log("🚀 Iniciando migración de prefijos...");

        // 1. Limpiar ingredientes_receta (idReferencia)
        const [result1] = await conn.query(`
            UPDATE ingredientes_receta 
            SET idReferencia = REPLACE(REPLACE(REPLACE(idReferencia, 'ns_', ''), 'loc_', ''), 'rec_', '')
            WHERE idReferencia LIKE 'ns_%' OR idReferencia LIKE 'loc_%' OR idReferencia LIKE 'rec_%'
        `);
        console.log(`✅ Ingredientes actualizados: ${result1.affectedRows}`);

        // 2. Limpiar ingredientes_receta (receta_id) si fuera necesario (usualmente no)
        
        // 3. Limpiar recetas (id)
        // NOTA: Esto es más delicado si hay llaves foráneas. En este esquema no parece haber FK formal.
        // Pero ingredientes_receta.receta_id apunta a recetas.id
        
        const [recetas] = await conn.query("SELECT id FROM recetas WHERE id LIKE 'rec_%'");
        for (const r of recetas) {
            const newId = r.id.replace('rec_', '');
            await conn.query("UPDATE ingredientes_receta SET receta_id = ? WHERE receta_id = ?", [newId, r.id]);
            await conn.query("UPDATE recetas SET id = ? WHERE id = ?", [newId, r.id]);
        }
        console.log(`✅ Recetas actualizadas: ${recetas.length}`);

        await conn.commit();
        console.log("✨ Migración completada con éxito.");
        process.exit(0);
    } catch (error) {
        await conn.rollback();
        console.error("❌ Error en migración:", error);
        process.exit(1);
    } finally {
        conn.release();
    }
}

migrate();
