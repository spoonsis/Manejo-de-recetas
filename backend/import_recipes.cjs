const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const pool = require('./config/database');
const svc = require('./servicios/ServicioRecetasInsumos');
const { listarArticulos } = require('./servicios/ServiciosSQLExternos');

const OUTPUT_DIR = path.join(__dirname, '../extractor-ia/output');
const PREVIEW_FILE = path.join(__dirname, 'Revision_Recetas_Masivo.xlsx');

async function importRecipes() {
    try {
        console.log("🚀 Iniciando Importación Masiva con Validación...");

        // 0. Intentar cargar sobrescrituras desde el Excel de revisión
        let overrides = new Map();
        try {
            const workbook = XLSX.readFile(PREVIEW_FILE);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            rows.forEach(row => {
                overrides.set(row["Archivo Original"], row);
            });
            console.log(`📝 Se cargaron ${overrides.size} posibles correcciones desde Excel.`);
        } catch (e) {
            console.log("⚠️ No se encontró el archivo de revisión. Se usarán datos de la IA sin correcciones.");
        }

        // 1. Obtener Maestro de NetSuite para mapeo de costos y existencia
        console.log("📥 Consultando maestros en Azure SQL...");
        const masters = await listarArticulos();
        const masterMap = new Map(masters.map(m => [m.id, m]));
        console.log(`✅ ${masters.length} artículos cargados desde NetSuite.`);

        // 2. Leer archivos JSON
        const files = await fs.readdir(OUTPUT_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log("ℹ️ No hay archivos JSON para importar.");
            return;
        }

        console.log(`📦 Procesando ${jsonFiles.length} recetas...`);

        for (const file of jsonFiles) {
            const rawData = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, file), 'utf-8'));
            
            // Generar ID único para la receta
            const recipeId = Math.random().toString(36).substr(2, 9);
            
            // Transformar ingredientes y generar snapshots
            let mp = 0, emp = 0, mudi = 0;
            const ingredientes = rawData.ingredientes.map(ing => {
                const codigoIdentificador = ing.codigoNetSuite || `TEMP_${Math.random().toString(36).substr(2, 5)}`;
                const nsItem = masterMap.get(ing.codigoNetSuite);
                const costoU = nsItem ? Number(nsItem.precioCompra || 0) : 0;
                const costoT = Number(ing.cantidad || 0) * costoU;

                // Clasificación de costos
                if (ing.nombre?.toUpperCase().includes('EMPAQUE')) emp += costoT;
                else mp += costoT;

                return {
                    idReferencia: codigoIdentificador,
                    nombre: ing.nombre,
                    cantidad: Number(ing.cantidad || 0),
                    unidad: ing.unidad || 'g',
                    tipo: 'INSUMO',
                    costoUnitario: costoU,
                    costoTotal: costoT,
                    snapshotCostoUnitario: costoU, // Snapshot para estado APROBADO
                    snapshotVersion: 1,
                    codigoNetSuite: ing.codigoNetSuite || null,
                    marca: ing.marca || '',
                    observaciones: ing.observaciones || null,
                    tipoMaterial: ing.nombre?.toUpperCase().includes('EMPAQUE') ? 'Empaque' : 'Materia Prima'
                };
            });

            const costoTotalFinal = mp + emp + mudi;
            const divisor = (rawData.porcionesCantidad || 1);

            const manualData = overrides.get(file) || {};

            // Preparar objeto para upsertReceta
            const recipeData = {
                id: recipeId,
                nombre: manualData["Nombre Receta (Display)"] || rawData.nombre,
                nombre_receta: manualData["Nombre Receta (NetSuite)"] || rawData.nombre,
                codigo_netsuite: manualData["Código NetSuite (Receta)"] || rawData.codigoNetSuiteReceta || "",
                estado: 'APROBADO', // Registro directo como aprobado
                versionActual: Number(rawData.version || 1),
                pasos: rawData.pasos || [],
                esSemielaborado: false,
                tipoCosteo: 'GRAMO',
                subsidiaria: manualData["Subsidiaria"] || rawData.subsidiaria || rawData.subsidiary || '',
                elaboradoPor: rawData.elaboradoPor?.split(',')[0] || '',
                areaProduce: rawData.areaProduce || '',
                areaEmpaca: rawData.areaEmpaca || '',
                pesoTotalCantidad: Number(manualData["Peso Total (g)"] ?? rawData.pesoTotalCantidad ?? 0),
                pesoTotalUnidad: rawData.pesoTotalUnidad || 'g',
                tiempoPrepCantidad: Number(rawData.tiempoPrepCantidad || 0),
                tiempoPrepUnidad: rawData.tiempoPrepUnidad || 'min',
                porcionesCantidad: Number(manualData["Porciones"] ?? rawData.porcionesCantidad ?? 1),
                porcionesUnidad: rawData.porcionesUnidad || 'ud',
                pesoPorcionCantidad: Number(manualData["Peso por Porción (g)"] ?? rawData.pesoPorcionCantidad ?? 0),
                pesoPorcionUnidad: rawData.pesoPorcionUnidad || 'g',
                mermaCantidad: Number(manualData["Merma"] ?? rawData.mermaCantidad ?? 0),
                mermaUnidad: rawData.mermaUnidad || '%',
                totalMP: mp,
                totalEMP: emp,
                totalMUDI: mudi,
                costoTotalBase: mp + emp,
                costoTotalFinal: costoTotalFinal,
                costoUnitarioMP: mp / (manualData["Porciones"] || divisor),
                costoUnitarioEMP: emp / (manualData["Porciones"] || divisor),
                costoUnitarioMUDI: mudi / (manualData["Porciones"] || divisor),
                ultimoRegistroCambios: rawData.registroCambios || 'Importación inicial desde IA (Auto-aprobada)',
                fechaRevision: new Date().toLocaleDateString('es-CR'),
                ingredientes: ingredientes,
                costoTotal: costoTotalFinal
            };

            await svc.upsertReceta(recipeData);
            console.log(`✅ Importada: ${recipeData.nombre}`);
        }

        console.log("\n✨ Importación masiva completada.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error en la importación:", error);
        process.exit(1);
    }
}

importRecipes();
