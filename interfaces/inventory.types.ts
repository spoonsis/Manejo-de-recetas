import { Rol } from './user.types';

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
  marca?: string;

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
  locales: string;
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

export interface FaseFluxoInsumo {
  id: string;
  orden: number;
  nombre: string;
  rolResponsable: Rol;
  campos: (keyof Insumo)[];
  activo: boolean;
  descripcion?: string;
}
