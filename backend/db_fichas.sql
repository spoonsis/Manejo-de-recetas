CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id VARCHAR(50) PRIMARY KEY,
    recetaId VARCHAR(50),
    nombreReceta VARCHAR(255),
    codigoCalidadPropio VARCHAR(100),
    estado VARCHAR(50),
    version INT DEFAULT 1,
    
    -- Encabezado
    subsidiaria VARCHAR(255),
    elaboradoPor VARCHAR(255),
    aprobadoPor VARCHAR(255),
    areaProduce VARCHAR(255),
    areaEmpaca VARCHAR(255),
    
    -- Descripcion
    descripcionTecnica TEXT,
    alergenos JSON,
    usoIntencional TEXT,
    consumidorObjetivo TEXT,
    restricciones TEXT,
    empaque VARCHAR(255),
    almacenamientoInterno TEXT,
    transporte TEXT,
    aspectoRechazo TEXT,
    almacenamientoPuntoVenta TEXT,
    vidaUtilCongelado VARCHAR(100),
    vidaUtilRefrigerado VARCHAR(100),
    vidaUtilAmbiente VARCHAR(100),
    pesoBruto VARCHAR(100),
    pesoNeto VARCHAR(100),
    pesoEtiqueta VARCHAR(100),
    requiereEtiquetaIngredientes BOOLEAN DEFAULT FALSE,
    registroMS VARCHAR(100),
    codigoBarras VARCHAR(100),
    comentariosCalidad TEXT,
    
    -- Propiedades Complejas (JSON)
    fisicas JSON,
    organolepticas JSON,
    aspectosMicrobiologicos JSON,
    imagenes JSON,
    requisitosLegales TEXT,
    
    fechaCreacion DATETIME,
    ultimaModificacion DATETIME
);

CREATE TABLE IF NOT EXISTS fichas_tecnicas_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ficha_id VARCHAR(50),
    fecha DATETIME,
    usuario VARCHAR(100),
    descripcion TEXT,
    version INT,
    FOREIGN KEY (ficha_id) REFERENCES fichas_tecnicas(id) ON DELETE CASCADE
);
