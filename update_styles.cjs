const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf-8');
    
    // Replace text sizes
    content = content.replace(/text-\[8px\]/g, 'text-[11px]');
    content = content.replace(/text-\[9px\]/g, 'text-xs');
    content = content.replace(/text-\[10px\]/g, 'text-sm');
    content = content.replace(/text-\[11px\]/g, 'text-sm');
    
    // Replace text colors to make them darker and more readable
    content = content.replace(/text-slate-300/g, 'text-slate-500');
    content = content.replace(/text-slate-400/g, 'text-slate-600');
    content = content.replace(/text-gray-400/g, 'text-gray-600');
    content = content.replace(/text-slate-500/g, 'text-slate-700');
    content = content.replace(/text-gray-500/g, 'text-gray-700');
    
    fs.writeFileSync(path.join(dir, file), content, 'utf-8');
});
console.log('UI styles updated successfully!');
