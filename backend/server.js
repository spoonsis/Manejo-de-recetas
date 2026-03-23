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
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./rutas/rutasAutenticacion");
const externalRoutes = require("./rutas/rutasExternas");
const costeoRoutes = require("./rutas/rutasCosteo");
const localRoutes = require("./rutas/rutasRecetasInsumos");
const fichasRoutes = require("./rutas/rutasFichas");
const notificacionesRoutes = require("./rutas/rutasNotificaciones");
const workflowsRoutes = require("./rutas/rutasWorkflows");
const uploadsRoutes = require("./rutas/rutasUploads");
const usuariosRoutes = require("./rutas/rutasUsuarios");

const { authMiddleware } = require("./middlewares/authMiddleware");

const app = express();

// Configuración de CORS dinámico para permitir acceso desde cualquier IP de la red local
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir cualquier origen (útil para desarrollo en red local con IPs variables)
        callback(null, true);
    },
    credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Logger de peticiones global
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Add static serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas Públicas
app.use("/api/auth", authRoutes);

// Rutas Protegidas (Requieren Login)
app.use("/api/usuarios", authMiddleware, (req, res, next) => {
    console.log(`[DEBUG] HIT /api/usuarios ${req.method} from ${req.ip}`);
    next();
}, usuariosRoutes);

app.use("/api", authMiddleware, externalRoutes);
app.use("/api/local", authMiddleware, localRoutes);
app.use("/api/local", authMiddleware, fichasRoutes);
app.use("/api/local/workflows", authMiddleware, workflowsRoutes);
app.use("/api/costeo", authMiddleware, costeoRoutes);
app.use("/api/notificaciones", authMiddleware, notificacionesRoutes);
global.getBaseUrl = () => process.env.BASE_URL || "http://localhost:3001";
app.use("/api/upload", authMiddleware, uploadsRoutes);

// Puerto 3001
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend en http://localhost:${PORT}`);
});