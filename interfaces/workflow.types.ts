import { Rol } from './user.types';
import { EstadoReceta } from './recipe.types';

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
