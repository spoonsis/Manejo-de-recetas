import { create } from 'zustand';
import { Usuario, Notificacion, Rol } from './types';

interface AppState {
  usuarioActual: Usuario | null;
  role: Rol;
  notificaciones: Notificacion[];
  isLoading: boolean;
  isLoadingData: boolean;
  isSaving: boolean;
  setUsuarioActual: (usuario: Usuario | null) => void;
  rehidratarSesion: () => Promise<void>;
  cargarNotificaciones: () => Promise<void>;
  enviarNotificacion: (rolDestino: string, titulo: string, mensaje: string, tipo?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER', referenciaId?: string | null) => Promise<void>;
  marcarNotificacionLeida: (id: number) => Promise<void>;
  marcarTodasNotificacionesLeidas: () => Promise<void>;
  logout: () => Promise<void>;
  setLoadingData: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

const getBaseUrl = () => {
    const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    return ``;
};

export const useStore = create<AppState>((set, get) => ({
  usuarioActual: null,
  role: 'CHEF',
  notificaciones: [],
  isLoading: false,
  isLoadingData: true, // asume de entrada que estamos cargando
  isSaving: false,
  setLoadingData: (loading) => set({ isLoadingData: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setUsuarioActual: (usuario) => {
    set({ usuarioActual: usuario, role: usuario?.rol || 'CHEF' });
    if (usuario) {
      get().cargarNotificaciones();
    }
  },
  rehidratarSesion: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ usuarioActual: data.user, role: data.user.rol });
        get().cargarNotificaciones();
      }
    } catch (e) {
      console.error("No active session", e);
    } finally {
      set({ isLoading: false });
    }
  },
  cargarNotificaciones: async () => {
    const { usuarioActual } = get();
    if (!usuarioActual) return;
    try {
      const res = await fetch(`/api/notificaciones?rol=${usuarioActual.rol}`, { credentials: 'include' });
      if (res.ok) {
        set({ notificaciones: await res.json() });
      }
    } catch (e) {
      console.error("Error loading notif", e);
    }
  },
  enviarNotificacion: async (rolDestino, titulo, mensaje, tipo = 'INFO', referenciaId = null) => {
    try {
      await fetch(`/api/notificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ rolDestino, titulo, mensaje, tipo, referenciaId })
      });
      get().cargarNotificaciones();
    } catch (error) {
      console.error("Error enviando notificación", error);
    }
  },
  marcarNotificacionLeida: async (id: number) => {
    try {
      const res = await fetch(`/api/notificaciones/${id}/leer`, { 
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        set((state) => ({
          notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n)
        }));
      }
    } catch (e) {
      console.error("Error marcando notificación como leída", e);
    }
  },
  marcarTodasNotificacionesLeidas: async () => {
    const { notificaciones } = get();
    const noLeidas = notificaciones.filter(n => !n.leida);
    if (noLeidas.length === 0) return;

    // Actualización optimista instantánea
    set((state) => ({
      notificaciones: state.notificaciones.map(n => ({ ...n, leida: true }))
    }));

    try {
      // Hacemos las peticiones en paralelo utilizando el endpoint individual ya existente en el servidor activo
      const promesas = noLeidas.map(n =>
        fetch(`/api/notificaciones/${n.id}/leer`, {
          method: 'PUT',
          credentials: 'include'
        })
      );
      
      const resultados = await Promise.all(promesas);
      const algunError = resultados.some(res => !res.ok);
      
      if (algunError) {
        console.error("Algunas notificaciones no se pudieron marcar como leídas en el servidor");
        get().cargarNotificaciones(); // Sincronizar/revertir si hubo fallos
      }
    } catch (e) {
      console.error("Error marcando todas las notificaciones como leídas", e);
      get().cargarNotificaciones(); // Revertir en caso de excepción
    }
  },
  logout: async () => {
    try {
      await fetch(`/api/auth/logout`, { method: 'POST', credentials: 'include' });
      set({ usuarioActual: null, role: 'CHEF', notificaciones: [] });
    } catch (e) {
      console.error("Error logging out", e);
    }
  }
}));
