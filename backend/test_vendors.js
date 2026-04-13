const { obtenerProveedores } = require('./servicios/ServiciosSQLExternos');

async function test() {
    try {
        console.log("Fetching vendors...");
        const vendors = await obtenerProveedores();
        console.log("Vendors found:", vendors.length);
        console.log("First 5 vendors:", vendors.slice(0, 5));
        process.exit(0);
    } catch (error) {
        console.error("Error fetching vendors:", error);
        process.exit(1);
    }
}

test();
