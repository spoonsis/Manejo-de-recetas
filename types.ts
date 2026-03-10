import { Check, FileText } from "lucide-react";

export enum EstadoReceta {
  BORRADOR = 'BORRADOR',
  PENDIENTE_COSTOS = 'PENDIENTE_COSTOS',
  PENDIENTE_MKT = 'PENDIENTE_MKT',
  PENDIENTE_CALIDAD = 'PENDIENTE_CALIDAD',
  APROBADO = 'APROBADO',
  RECHAZADO_COSTOS = 'RECHAZADO_COSTOS',
  RECHAZADO_MKT = 'RECHAZADO_MKT',
  RECHAZADO_CALIDAD = 'RECHAZADO_CALIDAD'
}

export enum EstadoFicha {
  BORRADOR = 'BORRADOR',
  PENDIENTE_CALIDAD = 'PENDIENTE_CALIDAD',
  COMPLETA = 'COMPLETA',
  INACTIVA = 'INACTIVA'
}

export type Permiso =
  | 'RECETAS_LECTURA'
  | 'RECETAS_ESCRITURA'
  | 'APROBAR_COSTOS'
  | 'APROBAR_MKT'
  | 'CERTIFICAR_CALIDAD'
  | 'GESTION_INSUMOS'
  | 'CONFIG_SISTEMA'
  | 'GESTION_USUARIOS'
  | 'FICHAS_TECNICAS';

export interface ConfiguracionRol {
  rol: Rol;
  permisos: Permiso[];
  color: string;
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
  };

  // Otros
  aspectosMicrobiologicos: AspectoMicrobiologico[];
  requisitosLegales: string;
  imagenes: string[];

  historialCambios: RegistroCambioFicha[];
  fechaCreacion: string;
  ultimaModificacion: string;
}

export interface PasoFlujo {
  id: string;
  orden: number;
  rolResponsable: Rol;
  accionRequerida: 'FIRMA_SIMPLE' | 'CODIGO_QC' | 'VALIDACION_COSTOS';
  estadoDestino: EstadoReceta;
  etiqueta: string;
}

export interface FlujoAprobacion {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: PasoFlujo[];
  activo: boolean;
}
export enum EstadoInsumo {
  PENDIENTE_COMPRAS = 'PENDIENTE_COMPRAS',
  PENDIENTE_CALIDAD = 'PENDIENTE_CALIDAD',
  PENDIENTE_LOGISTICA = 'PENDIENTE_LOGISTICA',
  COMPLETADO = 'COMPLETADO'
}
export interface Insumo {
  id: string;
  nombre: string;
  estado: EstadoInsumo;
  source?: 'INTERNA' | 'EXTERNA';

  // Fase 1: Compras
  tipoMaterial: string;
  unidad: string;
  unidadStock: string;
  pesoBruto: number;
  pesoNeto: number;
  precioCompra: number;
  tipoImpuesto: string;
  proveedor: string;
  codigoBarras: string;
  locales: boolean;
  documentos?: string[]; // Base64 o URLs de adjuntos

  // Fase 2: Calidad
  lote: boolean;
  alergenos: boolean;
  descripcionAlergenos: string;

  // Fase 3: Logística
  tipoAlmacenamiento: string;
  seccionAlisto: string;
  clasificacion: string;

  // Cálculos antiguos compatibles
  unidadConsumo: string;
  factorConversion: number;
  cantidadConvertida: number;
  precioPorUnidad: number;
  cantidadCompra: number;
}
export type ItemSidebar = {
  id: string;
  etiqueta: string;
  icon: any;
  roles: string[];
  badge?: string;
};



export interface IngredienteReceta {
  id: string;
  tipo: 'INSUMO' | 'SUBRECETA';
  idReferencia: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  codigo?: string;
  codigoNetSuite?: string;
  descripcionIngrediente?: string;
  marca?: string;
  observaciones?: string;
  tipoMaterial?: string;
  // Snapshot fields for audit
  snapshotCostoUnitario?: number;
  snapshotVersion?: number;
}

export interface HistorialVersiones {
  numeroVersion: number;
  fechaAprobacion: string;
  codigoCalidad: string;
  registroCambios: string;
  aprobadoPorCostos: string;
  aprobadoPorMkt: string;
  // Cost snapshot in history
  snapshotCostos?: {
    totalMP: number;
    totalEMP: number;
    totalMUDI: number;
    gif: number;
    costoTotalBase: number;
    costoTotalFinal: number;
  };
}

export interface Receta {
  id: string;
  nombre: string;
  estado: EstadoReceta;
  versionActual: number;
  ingredientes: IngredienteReceta[];
  pasos: string[];
  versiones: HistorialVersiones[];
  ultimoRegistroCambios: string;
  costoTotal: number;
  esSubReceta: boolean;
  esSemielaborado: boolean;
  codigoCalidad?: string;
  flujoAprobacionId?: string;

  // New Costing Engine Fields
  tipoCosteo: 'GRAMO' | 'UNIDAD';
  mudi: number;
  gif: number;

  // Results (Calculated)
  totalMP: number;
  totalEMP: number;
  totalMUDI: number;
  costoTotalBase: number;
  costoTotalFinal: number;

  // Unitary Results
  costoUnitarioMP: number;
  costoUnitarioEMP: number;
  costoUnitarioMUDI: number;

  pesoTotalCantidad?: number;
  pesoTotalUnidad?: string;
  tiempoPrepCantidad?: number;
  tiempoPrepUnidad?: string;
  porcionesCantidad?: number;
  porcionesUnidad?: string;
  pesoPorcionCantidad?: number;
  pesoPorcionUnidad?: string;
  mermaCantidad?: number;
  mermaUnidad?: string;

  subsidiaria: string;
  elaboradoPor: string;
  aprobadoPor: string;
  areaProduce: string;
  areaEmpaca: string;
}


export interface FaseFluxoInsumo {
  id: string;
  orden: number;
  nombre: string;
  rolResponsable: Rol;
  campos: (keyof Insumo)[];
  activo: boolean;
  descripcion?: string;
}

export interface Notificacion {
  id: number;
  rol_destino: string;
  titulo: string;
  mensaje: string;
  tipo: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  leida: boolean;
  fecha: string;
  referencia_id?: string;
}


export type Rol = string;

export interface Usuario {
  id: string;
  nombreUsuario: string;
  email: string;
  nombreCompleto: string;
  rol: Rol;
  activo: boolean;
  passwordHash?: string; // Simulación
  avatar?: string;
  ultimoAcceso?: string;
}


