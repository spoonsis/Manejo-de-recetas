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

export interface IngredienteReceta {
  id: string;
  tipo: 'INSUMO' | 'SEMIELABORADO';
  idReferencia: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  codigo?: string;
  codigoNetSuite?: string;
  descripcionIngrediente?: string;
  descripcionDetalle?: string;
  esSemielaborado?: boolean;
  marca?: string;
  observaciones?: string;
  tipoMaterial?: string;
  seccionReceta?: 'ENSAMBLE' | 'DECORACION' | 'EMPAQUE';
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
  sumaTotalInsumos?: number;
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
  fechaRevision?: string;
  nombre_receta?: string;
  codigo_netsuite?: string;
  detalle_nombre_receta?: string;
}
