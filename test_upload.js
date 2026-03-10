const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
    try {
        // Create a dummy file
        const testFilePath = path.join(__dirname, 'dummy_test.txt');
        fs.writeFileSync(testFilePath, 'Prueba de subida de archivo exitosa.');

        // Build FormData
        const form = new FormData();
        form.append('archivo', fs.createReadStream(testFilePath));

        console.log("Subiendo archivo a /api/upload...");
        const response = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) {
            console.error("Error al subir:", await response.text());
        } else {
            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            // Cleanup
            fs.unlinkSync(testFilePath);
            console.log("Archivo de prueba local eliminado.");
        }
    } catch (e) {
        console.error("Fallo la peticion:", e);
    }
}

testUpload();
