export enum EstadoFicha {
  BORRADOR = 'BORRADOR',
  PENDIENTE_CALIDAD = 'PENDIENTE_CALIDAD',
  COMPLETA = 'COMPLETA',
  INACTIVA = 'INACTIVA'
}

export interface RegistroCambioFicha {
  fecha: string;
  usuario: string;
  descripcion: string;
  version: number;
}

export interface AspectoMicrobiologico {
  microorganismo: string;
  detalle: string;
}

export interface FichaTecnica {
  id: string;
  recetaId: string;
  nombreReceta: string;
  codigoCalidadPropio: string;
  estado: EstadoFicha;
  version: number;

  // Encabezado
  subsidiaria: string;
  elaboradoPor: string;
  aprobadoPor: string;
  areaProduce: string;
  areaEmpaca: string;

  // Descripción del Producto
  descripcionTecnica: string;
  declaracionIngredientes: string;
  alergenos: string[];
  usoIntencional: string;
  consumidorObjetivo: string;
  restricciones: string;
  empaque: string;
  almacenamientoInterno: string;
  transporte: string;
  aspectoRechazo: string;
  almacenamientoPuntoVenta: string;
  vidaUtilCongelado: string;
  vidaUtilRefrigerado: string;
  vidaUtilAmbiente: string;
  pesoBruto: string;
  pesoNeto: string;
  pesoEtiqueta: string;
  requiereEtiquetaIngredientes: boolean;
  registroMS: string;
  codigoBarras: string;
  comentariosCalidad?: string;

  // Características Organolépticas y Físicas
  fisicas: {
    largo: string;
    ancho: string;
    altura: string;
    diametro: string;
    acidezTotal: string;
    ph: string;
    phMin?: string;
    phMax?: string;
    humedad: string;
    densidad: string;
    densidadMin?: string;
    densidadMax?: string;
    brix: string;
    brixMin?: string;
    brixMax?: string;
  };
  organolepticas: {
    color: string;
    sabor: string;
    textura: string;
    olor?: string;
  };

  // Otros
  aspectosMicrobiologicos: AspectoMicrobiologico[];
  requisitosLegales: string;
  imagenes: string[];

  versionesAnteriores?: FichaTecnica[];
  historialCambios: RegistroCambioFicha[];
  fechaCreacion: string;
  ultimaModificacion: string;
}
