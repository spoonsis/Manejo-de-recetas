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
    let retries = 5;
    let baseDelay = 5000; 

    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`
        });
        text = response.text;
        break; // Éxito, salir del loop
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        
        let waitTime = baseDelay * (6 - retries); // 5s -> 10s -> 15s -> 20s
        // Si el error de Google nos dice exactamente cuánto esperar, tomamos ese tiempo
        const match = error.message?.match(/Please retry in (\d+(\.\d+)?)s/i);
        if (match && match[1]) {
            waitTime = (parseFloat(match[1]) + 2) * 1000; // Le sumamos 2 segundos extra de seguridad
        }

        console.warn(`⚠️ Aviso: Error o API ocupada (${error.status || '503'}). Reintentando en ${(waitTime/1000).toFixed(1)}s...`);
        await sleep(waitTime);
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
    await sleep(4000); // Pausa de 4s entre archivos para no superar el límite gratuito (15 peticiones por minuto)
  }

  console.log("\n✨ Proceso terminado.");
}

main();
