const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const { listarArticulos } = require('./servicios/ServiciosSQLExternos');

const OUTPUT_DIR = path.join(__dirname, '../extractor-ia/output');

async function generatePreview() {
    try {
        console.log("🚀 Generando Reporte de Revisión Masiva...");

        // 1. Obtener Maestro de NetSuite para costos
        console.log("📥 Consultando precios en Azure SQL...");
        const masters = await listarArticulos();
        const masterMap = new Map(masters.map(m => [m.id, m]));
        console.log(`✅ ${masters.length} artículos cargados.`);

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

            dataRows.push({
                "Archivo Original": file,
                "Nombre Receta (Display)": rawData.nombre || "SIN NOMBRE",
                "Nombre Receta (NetSuite)": rawData.nombre || "",
                "Código NetSuite (Receta)": rawData.codigoNetSuiteReceta || "",
                "Subsidiaria": rawData.subsidiaria || rawData.subsidiary || "N/A",
                "Peso Total (g)": rawData.pesoTotalCantidad || 0,
                "Porciones": rawData.porcionesCantidad || 1,
                "Peso por Porción (g)": rawData.pesoPorcionCantidad || 0,
                "Costo Estimado (Total)": costoTotalEstimado.toFixed(2),
                "Ingredientes (Cant.)": rawData.ingredientes.length,
                "Coincidencias NetSuite": ingredientesEncontrados,
                "Estado": rawData.estado || "BORRADOR"
            });
        }

        // 3. Crear el libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataRows);
        
        // Ajustar anchos de columna básicos
        ws['!cols'] = [
            { wch: 40 }, // Archivo
            { wch: 30 }, // Display
            { wch: 30 }, // NS Name
            { wch: 20 }, // NS Code
            { wch: 25 }, // Subsidiaria
            { wch: 15 }, // Peso
            { wch: 10 }, // Porciones
            { wch: 15 }, // Peso/Porc
            { wch: 20 }, // Costo
            { wch: 15 }, // Ing
            { wch: 20 }, // Coincidencias
            { wch: 12 }  // Estado
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Revisión de Recetas");

        const exportPath = path.join(__dirname, 'Revision_Recetas_Masivo.xlsx');
        XLSX.writeFile(wb, exportPath);

        console.log(`\n✨ Reporte generado exitosamente:`);
        console.log(`📂 Ubicación: ${exportPath}`);
        console.log(`\nPor favor, abre el archivo, revisa los datos y dime si procedemos con la carga.`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error generando el reporte:", error);
        process.exit(1);
    }
}

generatePreview();
