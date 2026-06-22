const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const { listarArticulos } = require('./servicios/ServiciosSQLExternos');

const INPUT_DIR = path.join(__dirname, '../extractor-ia/input');
const OUTPUT_DIR = path.join(__dirname, '../extractor-ia/output');

async function generatePreview() {
    try {
        console.log("🚀 Generando Reporte de Revisión Masiva con Validaciones...");

        // 1. Obtener Maestro de NetSuite para costos
        let masters = [];
        try {
            console.log("📥 Consultando precios en Azure SQL...");
            masters = await listarArticulos();
            console.log(`✅ ${masters.length} artículos cargados.`);
        } catch (dbErr) {
            console.warn("⚠️ Advertencia: No se pudo conectar a Azure SQL (red o firewall). Los costos estimados se generarán en cero:", dbErr.message);
        }
        const masterMap = new Map(masters.map(m => [m.id, m]));


        // 2. Leer archivos JSON
        const files = await fs.readdir(OUTPUT_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log("❌ No se encontraron archivos JSON en la carpeta output del extractor.");
            return;
        }

        const dataRows = [];

        for (const file of jsonFiles) {
            const rawData = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, file), 'utf-8'));
            
            let costoTotalEstimado = 0;
            let ingredientesEncontrados = 0;

            rawData.ingredientes.forEach(ing => {
                const nsItem = masterMap.get(ing.codigoNetSuite);
                if (nsItem) {
                    ingredientesEncontrados++;
                    costoTotalEstimado += (Number(ing.cantidad || 0) * Number(nsItem.precioCompra || 0));
                }
            });

            // Localizar y abrir el archivo Excel original en input para extraer Elaborado/Aprobado
            let aprobadoPor = "";
            let elaboradoPor = "";
            let xlsxPath = path.join(INPUT_DIR, file.replace(/\.json$/, '.xlsx'));
            let xlsxExists = false;

            try {
                await fs.access(xlsxPath);
                xlsxExists = true;
            } catch (e) {
                // Probar con extensión .xls
                const xlsPath = path.join(INPUT_DIR, file.replace(/\.json$/, '.xls'));
                try {
                    await fs.access(xlsPath);
                    xlsxPath = xlsPath;
                    xlsxExists = true;
                } catch (e2) {}
            }

            if (xlsxExists) {
                try {
                    const workbook = XLSX.readFile(xlsxPath);
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                    for (const row of rows) {
                        if (!row) continue;
                        for (let colIdx = 0; colIdx < row.length - 1; colIdx++) {
                            const val = String(row[colIdx] || '').trim().toLowerCase();
                            if (val === 'aprobado' || val === 'aprobado:' || val === 'aprobó' || val === 'aprobo') {
                                aprobadoPor = String(row[colIdx + 1] || '').trim();
                                if (!aprobadoPor && colIdx < row.length - 2) {
                                    aprobadoPor = String(row[colIdx + 2] || '').trim();
                                }
                            }
                            if (val === 'elaborado' || val === 'elaborado:') {
                                elaboradoPor = String(row[colIdx + 1] || '').trim();
                                if (!elaboradoPor && colIdx < row.length - 2) {
                                    elaboradoPor = String(row[colIdx + 2] || '').trim();
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Error leyendo Excel original ${xlsxPath}:`, err.message);
                }
            }

            // Extraer códigos de calidad y NetSuite desde el nombre del archivo
            const fileCodeMatch = file.match(/^(ESP-RE-[A-Z0-9]+-\d+)/i);
            const fileCode = fileCodeMatch ? fileCodeMatch[1].toUpperCase() : "";

            const qualityCodeMatch = file.match(/\b(SE\d+|PTI\d+|PTL\d+|PT\d+)\b/i);
            const expectedInternalCode = qualityCodeMatch ? qualityCodeMatch[1].toUpperCase() : null;

            const nsCodeMatch = file.match(/\b(9\d{8}|3\d{7})\b/);
            const expectedNsCode = nsCodeMatch ? nsCodeMatch[1] : "";

            // Validación de código en el nombre de la receta
            let valCodigo = "OK";
            const recipeName = rawData.nombre || "";
            if (expectedInternalCode) {
                if (!recipeName.toUpperCase().includes(expectedInternalCode)) {
                    valCodigo = `FALTA CÓDIGO EN NOMBRE (Esperaba: ${expectedInternalCode})`;
                }
            } else {
                valCodigo = "NO SE ENCONTRÓ CÓDIGO EN ARCHIVO";
            }

            // Validación de aprobador
            let valAprobador = "OK";
            if (!aprobadoPor) {
                valAprobador = "FALTA APROBADOR";
            }

            dataRows.push({
                "Archivo Original": file,
                "Nombre Receta (Display)": recipeName,
                "Nombre Receta (NetSuite)": recipeName,
                "Código Calidad (Receta)": fileCode,
                "Código NetSuite (Receta)": expectedNsCode || expectedInternalCode || "",
                "Aprobado Por": aprobadoPor,
                "Elaborado Por": elaboradoPor || rawData.elaboradoPor || "",
                "Subsidiaria": rawData.subsidiaria || rawData.subsidiary || "N/A",
                "Peso Total (g)": rawData.pesoTotalCantidad || 0,
                "Porciones": rawData.porcionesCantidad || 1,
                "Peso por Porción (g)": rawData.pesoPorcionCantidad || 0,
                "Costo Estimado (Total)": costoTotalEstimado.toFixed(2),
                "Ingredientes (Cant.)": rawData.ingredientes.length,
                "Coincidencias NetSuite": ingredientesEncontrados,
                "Validación Código": valCodigo,
                "Validación Aprobación": valAprobador,
                "Estado": rawData.estado || "BORRADOR"
            });
        }

        // 3. Crear el libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataRows);
        
        // Ajustar anchos de columna
        ws['!cols'] = [
            { wch: 40 }, // Archivo
            { wch: 35 }, // Display
            { wch: 35 }, // NS Name
            { wch: 20 }, // Código Calidad (Receta)
            { wch: 20 }, // Código NetSuite (Receta)
            { wch: 25 }, // Aprobado Por
            { wch: 25 }, // Elaborado Por
            { wch: 25 }, // Subsidiaria
            { wch: 15 }, // Peso Total
            { wch: 10 }, // Porciones
            { wch: 15 }, // Peso/Porc
            { wch: 20 }, // Costo
            { wch: 15 }, // Ing
            { wch: 20 }, // Coincidencias
            { wch: 35 }, // Validación Código
            { wch: 20 }, // Validación Aprobación
            { wch: 12 }  // Estado
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Revisión de Recetas");

        const exportPath = path.join(__dirname, 'Revision_Recetas_Masivo.xlsx');
        XLSX.writeFile(wb, exportPath);

        console.log(`\n✨ Reporte generado exitosamente:`);
        console.log(`📂 Ubicación: ${exportPath}`);
        console.log(`\nPor favor, abre el archivo, revisa los datos y ejecuta el script de actualización.`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error generando el reporte:", error);
        process.exit(1);
    }
}

generatePreview();

