# GastroFlow Extractor IA 🚀

Este proyecto es una herramienta independiente diseñada para automatizar la extracción y estandarización de más de 1000 recetas desde archivos Excel desordenados hacia el formato JSON compatible con **GastroFlow Pro**.

## Estructura del Proyecto
- `/input`: Coloca aquí tus archivos Excel (`.xlsx`, `.xls`, `.csv`).
- `/output`: Aquí se generarán los archivos JSON listos para importar.
- `/prompts`: Contiene las instrucciones que sigue la IA para extraer los datos.
- `index.js`: El motor principal que procesa los archivos usando Gemini 1.5 Pro.

## Requisitos
- Node.js instalado.
- Una API Key de Google Gemini (puedes obtenerla gratis en AI Studio).

## Configuración e Instalación
1. Entra a la carpeta desde la terminal:
   ```bash
   cd extractor-ia
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tu API Key:
   - Renombra `.env.example` a `.env`
   - Pega tu API Key en la variable `GEMINI_API_KEY`.

## Cómo usar
1. Copia tus archivos Excel en la carpeta `/input`.
2. Ejecuta el extractor:
   ```bash
   npm start
   ```
3. Revisa los resultados en la carpeta `/output`.

## Siguiente Paso (Fase 2)
Una vez tengas los JSONs, los procesaremos en la aplicación principal para mapear los ingredientes con los insumos reales de tu base de datos.
