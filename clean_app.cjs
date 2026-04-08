const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');
let lines = content.split('\n');

// Find the start line dynamically just to be safe
const startIdx = lines.findIndex(l => l.includes('function EditorFichaTecnica({ ficha,'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('}')) + 1; // get the closing brace

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    console.log(`Removing from line ${startIdx + 1} to ${endIdx + 1}`);
    lines.splice(startIdx, endIdx - startIdx);
    
    // Insert import at the top
    const importIdx = lines.findIndex(l => l.includes('import EditorReceta from'));
    if (importIdx !== -1) {
        lines.splice(importIdx + 1, 0, "import EditorFichaTecnica from './EditorFichaTecnica';");
    }
    
    fs.writeFileSync('App.tsx', lines.join('\n'));
    console.log('App.tsx cleaned successfully');
} else {
    console.log('Could not find the function boundaries safely', startIdx, endIdx);
}
