export type Rol = string;

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
