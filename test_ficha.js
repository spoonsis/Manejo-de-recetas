const testFicha = {
    id: "test-ficha-001",
    recetaId: "receta-demo-123",
    nombreReceta: "Pastel de Chocolate Master",
    codigoCalidadPropio: "CAL-CHOC-001",
    estado: "COMPLETA",
    version: 1,
    subsidiaria: "Servicios de pastelería S.A",
    elaboradoPor: "Chef Test",
    aprobadoPor: "Gerente Calidad",
    areaProduce: "Panadería",
    areaEmpaca: "Empaque Seco",
    descripcionTecnica: "Pastel de chocolate húmedo con cubierta de ganache.",
    alergenos: ["Gluten", "Lácteos", "Huevo", "Soya"],
    usoIntencional: "Consumo directo",
    consumidorObjetivo: "Público general",
    restricciones: "No apto para celíacos",
    empaque: "Caja de cartón compostable",
    almacenamientoInterno: "Refrigeración a 4°C",
    transporte: "Camión refrigerado",
    aspectoRechazo: "Moho, empaque roto",
    almacenamientoPuntoVenta: "Vitrina refrigerada",
    vidaUtilCongelado: "N/A",
    vidaUtilRefrigerado: "5 días",
    vidaUtilAmbiente: "1 día",
    pesoBruto: "1.2 kg",
    pesoNeto: "1.0 kg",
    pesoEtiqueta: "1000g",
    requiereEtiquetaIngredientes: true,
    registroMS: "MS-123456",
    codigoBarras: "7501234567890",
    comentariosCalidad: "Cuidar la temperatura para evitar derretimiento del ganache.",
    fisicas: {
        largo: "20 cm",
        ancho: "20 cm",
        altura: "10 cm",
        diametro: "20 cm",
        acidezTotal: "0.5%",
        ph: "6.5",
        humedad: "30%",
        densidad: "1.2 g/cm3",
        brix: "45"
    },
    organolepticas: {
        color: "Café oscuro intenso",
        sabor: "Chocolate amargo dulce",
        textura: "Esponjosa y húmeda"
    },
    aspectosMicrobiologicos: [
        { parametro: "E. Coli", limite: "Ausencia", norma: "NOM-114" }
    ],
    imagenes: [],
    requisitosLegales: "Cumple con NOM-051",
    historialCambios: [
        {
            fecha: new Date().toISOString(),
            usuario: "ADMIN",
            descripcion: "Creación de ficha de prueba",
            version: 1
        }
    ],
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
};

async function crearFicha() {
    try {
        const res = await fetch("http://localhost:3001/api/local/fichas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testFicha)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("✅ Ficha de prueba creada:", data);
    } catch (error) {
        console.error("❌ Error creando ficha:", error);
    }
}

crearFicha();
