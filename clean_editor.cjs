const fs = require('fs');
let content = fs.readFileSync('EditorFichaTecnica.tsx', 'utf8');
let lines = content.split('\n');

const endOfComponent = lines.findIndex(l => l.startsWith('function VistaLibroRecetas'));
if (endOfComponent !== -1) {
    console.log(`Truncating file from line ${endOfComponent + 1}`);
    lines.splice(endOfComponent - 1, lines.length - endOfComponent + 1);
    fs.writeFileSync('EditorFichaTecnica.tsx', lines.join('\n'));
    console.log('File successfully truncated.');
} else {
    console.log('Could not find the start of the dead code.');
}
