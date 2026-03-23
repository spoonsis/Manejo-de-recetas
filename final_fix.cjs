const fs = require('fs');

const file = 'App.tsx';
let buffer = fs.readFileSync(file);

// Patterns to replace (HEX)
const replacements = [
    // Corrupted 'Á' in 'Área' (found c383 c692 c382 c281 in hex)
    { from: Buffer.from('c383c692c382c281', 'hex'), to: Buffer.from('Á') },
    // Corrupted 'Ú' in 'Útil' or 'Última' (checking hex again...)
];

// Let's find 'Ú' corruption hex
// In hex_output.txt line 1 it looked like '├Última'? No, that was line 1372.
// Line 1372 hex was c39a. That was already Ú! 
// Wait, then why did grep show 'ÃƒÅ¡ltima'?
// Let's re-grep line 1372 for the literal string.

let content = buffer.toString();
// Manual fixes for the ones grep found
content = content.replace(/ÃƒÂ rea/g, 'Área');
content = content.replace(/ÃƒÅ¡ltima/g, 'Última');
content = content.replace(/ÃƒÅ¡til/g, 'Útil');
content = content.replace(/Ãƒâ€°CNICA/g, 'TÉCNICA'); // TÃƒâ€°CNICA
content = content.replace(/TÃƒâ€°CNICA/g, 'TÉCNICA');
content = content.replace(/Ã‚Â°Bx/g, '°Bx');

fs.writeFileSync(file, content, 'utf8');
console.log('Final cleanup on App.tsx done.');
