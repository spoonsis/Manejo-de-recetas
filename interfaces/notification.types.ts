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
