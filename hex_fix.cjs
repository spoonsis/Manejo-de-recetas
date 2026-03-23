const fs = require('fs');

function fixFile(fileName) {
    let buffer = fs.readFileSync(fileName);
    
    // c3 83 c6 92 c3 82 c2 81 -> Á (c3 81)
    const pattern1 = Buffer.from('c383c692c382c281', 'hex');
    const replacement1 = Buffer.from('Á');

    // c3 83 c5 a1 (Ú)
    const pattern2 = Buffer.from('c383c5a1', 'hex'); // Checking if this matches 'Ú' corruption
    const replacement2 = Buffer.from('Ú');

    let changed = false;
    let index;
    
    while ((index = buffer.indexOf(pattern1)) !== -1) {
        buffer = Buffer.concat([
            buffer.slice(0, index),
            replacement1,
            buffer.slice(index + pattern1.length)
        ]);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(fileName, buffer);
        console.log(`Fixed hex patterns in ${fileName}`);
    } else {
        console.log(`No hex patterns found in ${fileName}`);
    }
}

fixFile('App.tsx');
