const fs = require('fs');
const files = ['App.tsx', 'Login.tsx', 'GestionUsuarios.tsx', 'useStore.ts', 'VistaInventario.tsx'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        const buffer = fs.readFileSync(file);
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            console.log(`BOM found in ${file}. Removing...`);
            fs.writeFileSync(file, buffer.slice(3));
        } else {
            console.log(`No BOM in ${file}`);
        }
    }
});
