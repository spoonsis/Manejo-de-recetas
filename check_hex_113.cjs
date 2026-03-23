const fs = require('fs');
const content = fs.readFileSync('App.tsx');
const hex = content.toString('hex');

// c383 c692 c382 c281 -> Á
// c383 c5â€œ -> Ó? No, let's find the hex for Ó in line 113
const lines = content.toString().split('\n');
const line113 = lines[112];
console.log('Line 113 text:', line113);
console.log('Line 113 hex:', Buffer.from(line113).toString('hex'));
