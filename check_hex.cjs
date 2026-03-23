const fs = require('fs');
const content = fs.readFileSync('App.tsx');
const lines = content.toString().split('\n');
const line1372 = lines[1371]; 
console.log('Line 1372 text:', line1372);
console.log('Line 1372 hex:', Buffer.from(line1372).toString('hex'));
