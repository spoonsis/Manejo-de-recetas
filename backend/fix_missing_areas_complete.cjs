const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/database');

const INPUT_DIR = path.join(__dirname, '../extractor-ia/input');
const OUTPUT_DIR = path.join(__dirname, '../extractor-ia/output');

function cleanString(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Extracts quality code like "ESP-RE-COFS-022" from a filename or text
function extractQualityCode(text) {
    const match = (text || '').match(/(ESP-RE-[A-Z0-9]+-\d+)/i);
    return match ? match[1].toUpperCase() : null;
}

// Extracts NetSuite code like "SE00323" or "PTL00289" from text
function extractNetsuiteCode(text) {
    const match = (text || '').match(/(SE\d+|PTL\d+|PTI\d+|EMP\d+)/i);
    return match ? match[1].toUpperCase() : null;
}

async function run() {
    try {
        console.log("🔍 Cargando recetas de la base de datos...");
        const [recipes] = await pool.query(
            "SELECT id, nombre, areaProduce, areaEmpaca, codigoCalidad, codigo_netsuite, detalle_nombre_receta FROM recetas"
        );
        console.log(`Loaded ${recipes.length} recipes from database.`);

        // Load all output JSONs
        console.log("📂 Cargando archivos JSON de extractor-ia/output...");
        const jsonFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
        const jsonList = [];
        
        for (const file of jsonFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8'));
                jsonList.push({
                    file,
                    nombre: data.nombre || '',
                    areaProduce: data.areaProduce || '',
                    areaEmpaca: data.areaEmpaca || '',
                    codigoCalidad: extractQualityCode(file) || extractQualityCode(data.nombre),
                    codigoNetsuite: extractNetsuiteCode(file) || extractNetsuiteCode(data.nombre) || data.codigoNetSuiteReceta
                });
            } catch (err) {
                console.warn(`⚠️ Error parseando JSON ${file}:`, err.message);
            }
        }
        console.log(`Loaded ${jsonList.length} JSON configurations.`);

        let updatedCount = 0;
        let excelParsedCount = 0;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const r of recipes) {
                let areaP = r.areaProduce;
                let areaE = r.areaEmpaca;
                let source = "";

                // Intenta encontrar coincidencia en los JSON cargados
                let jsonMatch = jsonList.find(j => {
                    if (r.codigoCalidad && j.codigoCalidad && r.codigoCalidad === j.codigoCalidad) return true;
                    if (r.codigo_netsuite && j.codigoNetsuite && r.codigo_netsuite === j.codigoNetsuite) return true;
                    return cleanString(r.nombre) === cleanString(j.nombre);
                });

                if (jsonMatch) {
                    if (jsonMatch.areaProduce && (!areaP || areaP.trim() === '')) {
                        areaP = jsonMatch.areaProduce;
                        source = "JSON";
                    }
                    if (jsonMatch.areaEmpaca && (!areaE || areaE.trim() === '')) {
                        areaE = jsonMatch.areaEmpaca;
                        source = "JSON";
                    }
                }

                // Si aún están vacíos, buscar y parsear el Excel original
                if (!areaP || areaP.trim() === '' || !areaE || areaE.trim() === '') {
                    // Buscar archivo Excel por nombre similar
                    const cleanRName = cleanString(r.nombre);
                    const files = fs.readdirSync(INPUT_DIR);
                    const matchingFile = files.find(f => {
                        if (!f.endsWith('.xlsx') && !f.endsWith('.xls')) return false;
                        const cleanF = cleanString(f.replace(/\.xlsx?$/, ''));
                        return cleanF === cleanRName || cleanF.includes(cleanRName) || cleanRName.includes(cleanF);
                    });

                    if (matchingFile) {
                        const filePath = path.join(INPUT_DIR, matchingFile);
                        try {
                            const workbook = XLSX.readFile(filePath);
                            const sheet = workbook.Sheets[workbook.SheetNames[0]];
                            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                            let excelAreaP = '';
                            let excelAreaE = '';

                            for (const row of rows) {
                                if (!row) continue;
                                for (let colIdx = 0; colIdx < row.length; colIdx++) {
                                    const val = String(row[colIdx] || '').trim().toLowerCase();
                                    
                                    if (val.includes('area que produce') || val.includes('área que produce')) {
                                        let nextIdx = colIdx + 1;
                                        while (nextIdx < row.length && !excelAreaP) {
                                            excelAreaP = String(row[nextIdx] || '').trim();
                                            nextIdx++;
                                        }
                                    }
                                    if (val.includes('area que empaca') || val.includes('área que empaca')) {
                                        let nextIdx = colIdx + 1;
                                        while (nextIdx < row.length && !excelAreaE) {
                                            excelAreaE = String(row[nextIdx] || '').trim();
                                            nextIdx++;
                                        }
                                    }
                                }
                            }

                            if (excelAreaP && (!areaP || areaP.trim() === '')) {
                                areaP = excelAreaP;
                                source = "Excel";
                                excelParsedCount++;
                            }
                            if (excelAreaE && (!areaE || areaE.trim() === '')) {
                                areaE = excelAreaE;
                                source = "Excel";
                                excelParsedCount++;
                            }

                            // Actualizar el archivo JSON correspondiente también para mantener consistencia
                            if (jsonMatch && (excelAreaP || excelAreaE)) {
                                const jsonPath = path.join(OUTPUT_DIR, jsonMatch.file);
                                const currentJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                                if (excelAreaP) currentJson.areaProduce = excelAreaP;
                                if (excelAreaE) currentJson.areaEmpaca = excelAreaE;
                                fs.writeFileSync(jsonPath, JSON.stringify(currentJson, null, 2), 'utf-8');
                            }

                        } catch (errExcel) {
                            // Ignorar error de lectura de Excel individual
                        }
                    }
                }

                // Si se obtuvo alguna actualización de áreas, actualizar la base de datos
                if (source !== "" && (areaP !== r.areaProduce || areaE !== r.areaEmpaca)) {
                    console.log(`Updating "${r.nombre}" (${r.id}):`);
                    console.log(`  - AreaProduce: "${r.areaProduce}" -> "${areaP}"`);
                    console.log(`  - AreaEmpaca: "${r.areaEmpaca}" -> "${areaE}"`);
                    console.log(`  - Source: ${source}`);

                    await connection.query(
                        "UPDATE recetas SET areaProduce = ?, areaEmpaca = ? WHERE id = ?",
                        [areaP, areaE, r.id]
                    );
                    updatedCount++;
                }
            }

            await connection.commit();
            console.log(`\nTransaction committed successfully!`);
            console.log(`- Total recetas actualizadas con áreas: ${updatedCount}`);
            console.log(`  (Actualizadas leyendo Excel original: ${excelParsedCount})`);

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

run();
