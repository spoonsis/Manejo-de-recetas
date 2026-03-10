const pool = require("./config/database");

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Conectado a MySQL");
        connection.release();
    } catch (error) {
        console.error("❌ Error conectando:", error);
    }
}

testConnection();
const express = require("express");
const cors = require("cors");

const externalRoutes = require("./rutas/rutasExternas");
const costeoRoutes = require("./rutas/rutasCosteo");
const localRoutes = require("./rutas/rutasRecetasInsumos");
const fichasRoutes = require("./rutas/rutasFichas");
const notificacionesRoutes = require("./rutas/rutasNotificaciones");

const app = express();

// Habilitar CORS para desarrollo multiusuario
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rutas
app.use("/api", externalRoutes);
app.use("/api/local", localRoutes);
app.use("/api/local", fichasRoutes); // Add new Fichas routes
app.use("/api/costeo", costeoRoutes);
app.use("/api/notificaciones", notificacionesRoutes);

// Puerto 3001
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend en http://localhost:${PORT}`);
});