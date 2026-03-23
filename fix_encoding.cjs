const fs = require('fs');
const path = require('path');

const filesToFix = [
    'App.tsx',
    'Login.tsx',
    'GestionUsuarios.tsx',
    'useStore.ts',
    'VistaInventario.tsx'
];

const replacements = [
    // --- DOUBLE ENCODING (Mainly App.tsx) ---
    { from: /ÃƒÂ­/g, to: 'í' },
    { from: /ÃƒÂ¡/g, to: 'á' },
    { from: /ÃƒÂ³/g, to: 'ó' },
    { from: /ÃƒÂ©/g, to: 'é' },
    { from: /ÃƒÂº/g, to: 'ú' },
    { from: /ÃƒÂ±/g, to: 'ñ' },
    { from: /ÃƒÂ /g, to: 'Á' },
    { from: /ÃƒÂ rea/g, to: 'Área' },
    { from: /ÃƒÂ¡/g, to: 'á' },
    { from: /Ãƒâ€œ/g, to: 'Ó' },
    { from: /Ãƒâ€°/g, to: 'É' },
    { from: /Ãƒâ‚¬/g, to: 'À' },
    { from: /ÃƒÅ¡/g, to: 'Ú' },
    { from: /ÃƒÂ±/g, to: 'ñ' },
    { from: /aÃƒÂ±o/g, to: 'año' },
    { from: /Ã‚Â°/g, to: '°' },

    // --- SINGLE ENCODING (Others) ---
    { from: /Ã­/g, to: 'í' },
    { from: /Ã¡/g, to: 'á' },
    { from: /Ã³/g, to: 'ó' },
    { from: /Ã©/g, to: 'é' },
    { from: /Ãº/g, to: 'ú' },
    { from: /Ã±/g, to: 'ñ' },
    { from: /Ã“/g, to: 'Ó' },
    { from: /Ã‰/g, to: 'É' },
    { from: /Ãš/g, to: 'Ú' },
    { from: /Ã¡/g, to: 'á' },
    { from: /Ã³/g, to: 'ó' },
    { from: /Ãº/g, to: 'ú' },
    { from: /Ã±/g, to: 'ñ' },
    { from: /âœ…/g, to: '✅' },
];

filesToFix.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        replacements.forEach(rep => {
            content = content.replace(rep.from, rep.to);
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${file}`);
        } else {
            console.log(`No changes needed: ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
