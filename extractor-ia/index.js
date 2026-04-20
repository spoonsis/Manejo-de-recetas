import fs from 'fs-extra';
import path from 'path';
import xlsx from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const INPUT_DIR = './input';
const OUTPUT_DIR = './output';
const PROMPT_FILE = './prompts/system_prompt.txt';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const outputFileName = fileName.replace(/\.[^/.]+$/, "") + ".json";
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  if (await fs.pathExists(outputPath)) {
    console.log(`⏩ Saltando (ya procesado): ${fileName}`);
    return;
  }

  console.log(`\n📄 Procesando: ${fileName}...`);

  try {
    // 1. Leer Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const csvData = xlsx.utils.sheet_to_csv(sheet);

    // 2. Preparar Prompt
    const systemPrompt = await fs.readFile(PROMPT_FILE, 'utf-8');
    const userPrompt = `Contenido del archivo Excel (${fileName}):\n\n${csvData}`;

    // 3. Llamar a IA con reintentos
    let text = '';
    let retries = 3;
    let delay = 3000; // Iniciar con 3 segundos

    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `${systemPrompt}\n\n${userPrompt}`
        });
        text = response.text;
        break; // Éxito, salir del loop
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        
        console.warn(`⚠️ Aviso: API ocupada o error temporal. Reintentando en ${delay/1000}s... (Quedan ${retries} intentos)`);
        await sleep(delay);
        delay *= 2; // Espera exponencial
      }
    }

    // Limpiar respuesta (quitar backticks de markdown si existen)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 4. Validar JSON
    const jsonData = JSON.parse(text);

    // 5. Guardar Resultado
    const outputFileName = fileName.replace(/\.[^/.]+$/, "") + ".json";
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    await fs.writeJson(outputPath, jsonData, { spaces: 2 });

    console.log(`✅ Éxito: Guardado en ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error procesando ${fileName}:`, error.message);
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY no configurado en el archivo .env");
    return;
  }

  await fs.ensureDir(OUTPUT_DIR);
  const files = await fs.readdir(INPUT_DIR);
  const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));

  if (excelFiles.length === 0) {
    console.log("ℹ️ No se encontraron archivos Excel en la carpeta /input");
    return;
  }

  console.log(`🚀 Iniciando extracción de ${excelFiles.length} archivos...`);

  for (const file of excelFiles) {
    await processFile(path.join(INPUT_DIR, file));
    await sleep(1000); // Pausa de 1s entre archivos para cortesía con la API
  }

  console.log("\n✨ Proceso terminado.");
}

main();
