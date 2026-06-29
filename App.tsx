import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminWorkflows from './AdminWorkflows';
import GestionUsuarios from './GestionUsuarios';
import VistaInventario from './VistaInventario';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExportarRecetaPDF from './ExportarRecetaPDF';
import ExportarFichaTecnicaPDF from './ExportarFichaTecnicaPDF';
import Panel from './Panel';
import VistaFichasTecnicas from './VistaFichasTecnicas';
import VistaLibroRecetas from './VistaLibroRecetas';
import VisorRecetaLibro from './VisorRecetaLibro';
import EditorReceta from './EditorReceta';
import EditorFichaTecnica from './EditorFichaTecnica';
import VistaAprobaciones from './VistaAprobaciones';

import {
  Utensils, Package, ClipboardList, CheckCircle2, History, Plus, Trash2, CheckCheck,
  LayoutGrid, List as ListIcon,
  Edit3, Eye, AlertCircle, TrendingUp, LayoutDashboard, Search, Save, X,
  FileText, BadgeCheck, Calculator, RefreshCw, Sparkles, ShieldCheck, Info,
  Clock, Bell, Scale, Check, Lock, Tag, Timer, Layers, Dna, Users, Warehouse,
  Building2, BookOpen, ArrowRight, Settings2, ShieldAlert, GitBranch, Key,
  ToggleRight, CheckSquare, FlaskConical, Activity, ArchiveX, Camera, Microscope,
  ChefHat, DollarSign, PieChart, Star, SlidersHorizontal, UserPlus, ChevronRight,
  ChevronLeft, ChevronUp, AlertTriangle, Download, User, Loader2, Snowflake, Flame, Coffee, Palette, Cake, HelpCircle, FileEdit, XCircle,
  Factory
} from 'lucide-react';
import { Receta, Insumo, EstadoReceta, EstadoInsumo, Rol, IngredienteReceta, ConfiguracionRol, Permiso, FlujoAprobacion, PasoFlujo, FichaTecnica, EstadoFicha, RegistroCambioFicha, AspectoMicrobiologico, FaseFluxoInsumo, HistorialVersiones, Notificacion } from './types';
import { ESTILOS_ESTADO, ETIQUETAS_ESTADO, ESTILOS_ESTADO_INSUMO, ETIQUETAS_ESTADO_INSUMO, UNIDADES, UNIDADES_STOCK, OPCIONES_IMPUESTO, TIPOS_MATERIAL, MAPA_CONVERSION_UNIDADES } from './constants';
import { optimizarPasosReceta } from './geminiService';
import { useStore } from './useStore';
import { Skeleton } from './components/Skeleton';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';

// --- Listas de Referencia ---
// Ahora se cargan desde el backend: maestro_areas
const MICROORGANISMOS_INICIALES = ["Salmonella spp", "Listeria monocytogenes", "Escherichia coli", "Mohos y Levaduras", "Staphylococcus aureus"];
const PERMISOS_DISPONIBLES: Permiso[] = [
  'RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS',
  'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS',
  'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS',
  'DESCARGA_MASIVA', 'DESCARGA_INDIVIDUAL'
];

const CONFIG_ROLES_INICIAL: ConfiguracionRol[] = [
  { rol: 'CHEF', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'GESTION_INSUMOS', 'FICHAS_TECNICAS', 'DESCARGA_MASIVA', 'DESCARGA_INDIVIDUAL'], color: 'bg-blue-500' },
  { rol: 'COSTOS', permisos: ['RECETAS_LECTURA', 'APROBAR_COSTOS', 'GESTION_INSUMOS'], color: 'bg-yellow-500' },
  { rol: 'MKT', permisos: ['RECETAS_LECTURA', 'APROBAR_MKT'], color: 'bg-orange-500' },
  { rol: 'CALIDAD', permisos: ['RECETAS_LECTURA', 'CERTIFICAR_CALIDAD', 'FICHAS_TECNICAS', 'GESTION_INSUMOS', 'DESCARGA_INDIVIDUAL'], color: 'bg-purple-500' },
  { rol: 'COMPRAS', permisos: ['GESTION_INSUMOS'], color: 'bg-emerald-500' },
  { rol: 'LOGISTICA', permisos: ['GESTION_INSUMOS'], color: 'bg-orange-500' },
  { rol: 'ADMIN', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS', 'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS', 'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS', 'DESCARGA_MASIVA', 'DESCARGA_INDIVIDUAL'], color: 'bg-slate-900' }
];

const FLUJO_DEFAULT: FlujoAprobacion = {
  id: 'f1',
  nombre: 'Flujo Estándar Gastronómico',
  descripcion: 'Proceso de validación técnica, comercial y de seguridad alimentaria.',
  activo: true,
  pasos: [
    { id: 'p1', orden: 1, rolResponsable: 'COSTOS', accionRequerida: 'VALIDACION_COSTOS', estadoDestino: EstadoReceta.PENDIENTE_MKT, etiqueta: 'Auditoría de Margen' },
    { id: 'p2', orden: 2, rolResponsable: 'MKT', accionRequerida: 'FIRMA_SIMPLE', estadoDestino: EstadoReceta.PENDIENTE_CALIDAD, etiqueta: 'Validación Comercial' },
    { id: 'p3', orden: 3, rolResponsable: 'CALIDAD', accionRequerida: 'CODIGO_QC', estadoDestino: EstadoReceta.APROBADO, etiqueta: 'Certificación de Calidad' },
  ]
};

const insumosIniciales: Insumo[] = [
  {
    id: '1',
    nombre: 'Harina de Trigo',
    estado: EstadoInsumo.COMPLETADO,
    tipoMaterial: 'Materia Prima',
    unidad: 'kg',
    unidadStock: 'kg',
    pesoBruto: 1,
    pesoNeto: 1,
    precioCompra: 12000,
    tipoImpuesto: 'IVA 19%',
    proveedor: 'Molinos del Sur',
    codigoBarras: '7701234567890',
    locales: 'Si',
    documentos: [],
    lote: true,
    alergenos: true,
    descripcionAlergenos: 'Gluten',
    tipoAlmacenamiento: 'Seco',
    seccionAlisto: 'Panadería',
    clasificacion: 'A',
    unidadConsumo: 'g',
    factorConversion: 0.001,
    cantidadConvertida: 10000,
    precioPorUnidad: 1.2,
    cantidadCompra: 10
  }
];

const FASES_INSUMO_DEFAULT: FaseFluxoInsumo[] = [
  {
    id: 'f1', orden: 1, nombre: 'Compras', rolResponsable: 'COMPRAS', activo: true,
    campos: ['nombre', 'marca', 'tipoMaterial', 'unidad', 'unidadStock', 'pesoBruto', 'pesoNeto', 'precioCompra', 'tipoImpuesto', 'proveedor', 'codigoBarras', 'documentos', 'unidadConsumo', 'factorConversion', 'cantidadCompra', 'precioPorUnidad', 'cantidadConvertida']
  },
  {
    id: 'f2', orden: 2, nombre: 'Calidad', rolResponsable: 'CALIDAD', activo: true,
    campos: ['lote', 'alergenos', 'descripcionAlergenos']
  },
  {
    id: 'f3', orden: 3, nombre: 'Logística', rolResponsable: 'LOGISTICA', activo: true,
    campos: ['tipoAlmacenamiento', 'seccionAlisto', 'clasificacion', 'locales', 'tipoUnidad', 'unidadBase', 'tipoRotacion', 'ciTipoArticulo', 'metodoCalculo', 'categoriaCosto', 'tipoEstimacion', 'programaFiscal']
  }
];

// --- CONFIGURACIÓN ---

import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ChangePassword from './ChangePassword';
import AdminUsers from './AdminUsers';
import { Usuario } from './types';

// --- DATOS INICIALES MOCK USUARIOS ---


import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

export default function App() {
  const {
    usuarioActual,
    setUsuarioActual,
    role: rol,
    notificaciones,
    cargarNotificaciones,
    enviarNotificacion,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    rehidratarSesion,
    isLoading: isAuthLoading,
    setLoadingData,
    setSaving
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();
  const vista = location.pathname === '/' ? 'panel' : location.pathname.substring(1);

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [statsRecetas, setStatsRecetas] = useState({ total: 0, aprobadas: 0, pendientes: 0 });
  const [paginaRecetas, setPaginaRecetas] = useState(1);
  const [insumos, setInsumos] = useState<Insumo[]>(insumosIniciales);
  const [insumosUnificados, setInsumosUnificados] = useState<any[]>([]);
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [editandoReceta, setEditandoReceta] = useState<Receta | null>(null);
  const [editandoFicha, setEditandoFicha] = useState<FichaTecnica | null>(null);
  const [detalleLibro, setDetalleLibro] = useState<Receta | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Estados de Administración
  const [configRoles, setConfigRolesState] = useState<ConfiguracionRol[]>(CONFIG_ROLES_INICIAL);

  const guardarConfigRoles = async (nuevaConfig: ConfiguracionRol[]) => {
    try {
      const res = await fetch(`/api/usuarios/roles/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nuevaConfig)
      });
      if (!res.ok) {
        console.error("Error guardando roles en base de datos:", res.statusText);
      }
    } catch (e) {
      console.error("Fallo de red al guardar roles:", e);
    }
  };

  const setConfigRoles = useCallback((update: any) => {
    setConfigRolesState((prev) => {
      const nextValue = typeof update === 'function' ? update(prev) : update;
      guardarConfigRoles(nextValue);
      return nextValue;
    });
  }, []);

  const [flujos, setFlujos] = useState<FlujoAprobacion[]>([FLUJO_DEFAULT]);
  const [fasesInsumo, setFasesInsumo] = useState<FaseFluxoInsumo[]>(FASES_INSUMO_DEFAULT);
  const [maestroMicroorganismos, setMaestroMicroorganismos] = useState<string[]>(MICROORGANISMOS_INICIALES);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [areasMaestras, setAreasMaestras] = useState<{ id: number, nombre: string }[]>([]);

  // Tab Admin Interno
  const [adminTab, setAdminTab] = useState<'workflows' | 'usuarios'>('workflows');

  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [editandoInsumoId, setEditandoInsumoId] = useState<string | null>(null);

  const manejarClickNotificacion = (n: Notificacion) => {
    if (!n.leida) marcarNotificacionLeida(n.id);
    
    const titulo = n.titulo.toLowerCase();
    
    if (titulo.includes('insumo')) {
        navigate('/inventario');
        setEditandoInsumoId(n.referencia_id || null);
    } else if (titulo.includes('aprobada') && titulo.includes('receta')) {
        navigate('/libro');
        const receta = recetas.find(r => r.id === n.referencia_id);
        if (receta) setDetalleLibro(receta);
    } else if (titulo.includes('revisión') || titulo.includes('pendient')) {
        navigate('/aprobaciones');
        const receta = recetas.find(r => r.id === n.referencia_id);
        if (receta) setEditandoReceta(receta);
    } else if (titulo.includes('rechazada') && titulo.includes('receta')) {
        navigate('/recetas');
        const receta = recetas.find(r => r.id === n.referencia_id);
        if (receta) setEditandoReceta(receta);
    }
    
    setMostrarNotificaciones(false);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    rehidratarSesion();
  }, [rehidratarSesion]);

  useEffect(() => {
    const interval = setInterval(cargarNotificaciones, 10000); // 10s para testing rápido
    return () => clearInterval(interval);
  }, [cargarNotificaciones]);

  // CARGA DE DATOS DESDE API SQL
  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingData(true);
      try {
        // 1. Cargar Recetas Paginadas iniciales
        const resRecetas = await fetch(`/api/local/recetas?page=1&limit=2000`, { credentials: 'include' });
        if (resRecetas.ok) {
          const resJson = await resRecetas.json();
          if (resJson.stats) {
            setRecetas(resJson.data);
            setStatsRecetas(resJson.stats);
            setPaginaRecetas(resJson.page);
          } else {
            setRecetas(resJson); // Fallback old structure
          }
        }

        // 2. Cargar Insumos Nuevos
        let nuevosInsumosNuevos = [];
        const resInsumosNuevos = await fetch(`/api/local/insumos/locales`, { credentials: 'include' });
        if (resInsumosNuevos.ok) {
          nuevosInsumosNuevos = await resInsumosNuevos.json();
        }

        // 3. Cargar Insumos NetSuite
        let nuevosInsumosNetSuite = [];
        const resNetSuite = await fetch(`/api/articulos`, { credentials: 'include' });
        if (resNetSuite.ok) {
          nuevosInsumosNetSuite = await resNetSuite.json();
          console.log("Datos NetSuite recibidos:", nuevosInsumosNetSuite.length);
        }

        setInsumos(() => {
          return [
            ...nuevosInsumosNetSuite.map((ns: any) => ({
              id: ns.id,
              nombre: ns.nombre,
              tipo: 'NETSUITE',
              clase: TIPOS_MATERIAL[0], // 'Materia Prima'
              unidadMedida: MAPA_CONVERSION_UNIDADES[ns.unidad?.toLowerCase()] || ns.unidad || 'Unidad',
              precioCompra: Number(ns.precioCompra || 0),
              rendimiento: 100,
              alergenos: [],
              temporada: 'Todo el año',
              estado: EstadoInsumo.COMPLETADO,
              merma: 0,
              marca: ns.marca || '',
              source: 'EXTERNA'
            })),
            ...nuevosInsumosNuevos.map((loc: any) => ({
              ...loc,
              id: loc.id,
              nombre: loc.nombre,
              tipo: 'LOCAL',
              clase: loc.tipo || TIPOS_MATERIAL[0], // Map from DB
              unidadMedida: loc.unidadReceta || 'Unidad',
              precioCompra: Number(loc.precioCompra || loc.precioPorUnidad || 0),
              rendimiento: loc.rendimiento || 100,
              alergenos: loc.alergenos || [],
              temporada: loc.temporada || 'Todo el año',
              estado: loc.estado || EstadoInsumo.COMPLETADO,
              merma: loc.merma || 0,
              source: 'INTERNA'
            }))
          ];
        });

        // 4. Cargar Fichas Técnicas
        const resFichas = await fetch(`/api/local/fichas`, { credentials: 'include' });
        if (resFichas.ok) {
          const dataFichas = await resFichas.json();
          setFichas(dataFichas);
        }

        // 4.5 Cargar Insumos Unificados
        const resUnificados = await fetch(`/api/local/insumos-unificados`, { credentials: 'include' });
        if (resUnificados.ok) {
          setInsumosUnificados(await resUnificados.json());
        }

        // 5. Cargar Flujos de Aprobación
        const resWorkflows = await fetch(`/api/local/workflows?t=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
        if (resWorkflows.ok) {
          const dataWorkflows = await resWorkflows.json();
          if (dataWorkflows.length > 0) {
            setFlujos(dataWorkflows);
          } else {
            console.log("Sembrando flujo default...");
            await manejarGuardarFlujo(FLUJO_DEFAULT);
          }
        }

        // 5.5 Cargar Fases Insumo
        const resFases = await fetch(`/api/local/workflows/insumos`, { credentials: 'include' });
        if (resFases.ok) {
          const dataFases = await resFases.json();
          if (dataFases.length > 0) {
            setFasesInsumo(dataFases);
          } else {
            console.log("Sembrando fases insumo default...");
            for (const f of FASES_INSUMO_DEFAULT) {
               await fetch(`/api/local/workflows/insumos`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 credentials: 'include',
                 body: JSON.stringify(f)
               });
            }
            setFasesInsumo(FASES_INSUMO_DEFAULT);
          }
        }

        // Cargar Configuración de Roles
        try {
          const resRoles = await fetch(`/api/usuarios/roles/config`, { credentials: 'include' });
          if (resRoles.ok) {
            const dataRoles = await resRoles.json();
            if (dataRoles && dataRoles.length > 0) {
              setConfigRolesState(dataRoles);
            } else {
              console.log("Sembrando roles iniciales en base de datos...");
              await fetch(`/api/usuarios/roles/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(CONFIG_ROLES_INICIAL)
              });
              setConfigRolesState(CONFIG_ROLES_INICIAL);
            }
          }
        } catch (errRoles) {
          console.error("Error al cargar roles de la BD:", errRoles);
          setConfigRolesState(CONFIG_ROLES_INICIAL);
        }

        // 6. Cargar Proveedores SQL Server
        const resProveedores = await fetch(`/api/proveedores`, { credentials: 'include' });
        if (resProveedores.ok) {
          setProveedores(await resProveedores.json());
        }

        // 7. Cargar Áreas Maestras
        try {
          const resAreas = await fetch(`/api/maestros/areas`, { credentials: 'include' });
          if (resAreas.ok) {
            const data = await resAreas.json();
            console.log("✅ Áreas maestras cargadas:", data.length);
            setAreasMaestras(data);
          } else {
            console.warn("⚠️ No se pudieron cargar las áreas maestras:", resAreas.status);
          }
        } catch (e) {
          console.error("❌ Fallo crítico cargando áreas:", e);
        }
      } catch (error) {
        console.error("Error cargando todos los catálogos:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (usuarioActual) {
      cargarDatos();
    }
  }, [usuarioActual, setLoadingData]);

  const calcularCostoTotal = (ingredientes: IngredienteReceta[]) => {
    return ingredientes.reduce((suma, item) => suma + item.costoTotal, 0);
  };

  const manejarGuardarInsumo = async (insumo: Insumo) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/local/insumos/locales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(insumo)
      });
      if (res.ok) {
        // En actualizar estado local si la BD salvó bien
        setInsumos((prev: any[]) => {
          const existe = prev.find((i: { id: string; }) => i.id === insumo.id);

          setTimeout(() => {
            if (!existe && insumo.locales) {
              const primerFase = fasesInsumo.find(f => f.orden === 1);
              if (primerFase) enviarNotificacion(primerFase.rolResponsable, 'Nuevo Insumo Local', `El Chef creó el insumo "${insumo.nombre}", por favor completa la información inicial.`, 'WARNING', insumo.id);
            } else if (existe) {
              if (existe.estado !== EstadoInsumo.COMPLETADO && insumo.estado === EstadoInsumo.COMPLETADO) {
                enviarNotificacion('TODOS', 'Insumo Completado', `La información del insumo "${insumo.nombre}" ha sido completada por todas las áreas.`, 'SUCCESS', insumo.id);
              } else if (insumo.estado !== EstadoInsumo.COMPLETADO) {
                const faseActual = fasesInsumo.find(f => f.rolResponsable === usuarioActual?.rol);
                if (faseActual) {
                  const faseSiguiente = fasesInsumo.find(f => f.orden === faseActual.orden + 1);
                  if (faseSiguiente) enviarNotificacion(faseSiguiente.rolResponsable, 'Actualización de Insumo', `El Insumo "${insumo.nombre}" fue actualizado por ${faseActual.nombre} y requiere tu validación.`, 'INFO', insumo.id);
                }
              }
            }
          }, 0);

          if (existe) return prev.map((i: { id: string; }) => i.id === insumo.id ? insumo : i);
          return [...prev, insumo];
        });
      } else {
        console.error("Error al guardar Insumo en Backend.");
      }
    } catch (error) {
      console.error("Error de Red:", error);
    } finally {
      setSaving(false);
    }
  };

  // --- HANDLERS RECETAS ---

  const manejarCrearReceta = () => {
    const flujoDefault = flujos.find(f => f.activo)?.id || (flujos.length > 0 ? flujos[0].id : '');
    const nuevaReceta: Receta = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: '',
      estado: EstadoReceta.BORRADOR,
      versionActual: 1,
      esSemielaborado: false,
      codigoCalidad: '',
      flujoAprobacionId: flujoDefault,
      subsidiaria: 'Servicios de pastelería S.A',
      elaboradoPor: usuarioActual?.nombreCompleto || 'Usuario Desconocido',
      aprobadoPor: '',
      areaProduce: '',
      areaEmpaca: '',
      ingredientes: [],
      pasos: [],
      versiones: [],
      ultimoRegistroCambios: 'Nueva creación',
      costoTotal: 0,
      pesoTotalCantidad: 0,
      pesoTotalUnidad: 'g',
      sumaTotalInsumos: 0,
      tiempoProcesoMinutos: 0,
      porcionesCantidad: 0,
      porcionesUnidad: 'porciones',
      pesoPorcionCantidad: 0,
      pesoPorcionUnidad: 'g',
      mermaCantidad: 0,
      mermaUnidad: '%',
      tipoCosteo: 'GRAMO',
      mudi: 77,
      gif: 0,
      totalMP: 0,
      totalEMP: 0,
      totalMUDI: 0,
      costoTotalBase: 0,
      costoTotalFinal: 0,
      costoUnitarioMP: 0,
      costoUnitarioEMP: 0,
      costoUnitarioMUDI: 0,
      nombre_receta: '',
      codigo_netsuite: '',
      detalle_nombre_receta: '',
    };
    setEditandoReceta(nuevaReceta);
  };


  const manejarRefrescarCostos = async (idReceta: string) => {
    const receta = recetas.find((r: { id: string; }) => r.id === idReceta);
    if (!receta) return;

    const nuevosIngredientes = receta.ingredientes.map((ing: { costoUnitario: any; tipo: string; idReferencia: any; cantidad: number; }) => {
      let nuevoCostoUnitario = ing.costoUnitario;
      if (ing.tipo === 'INSUMO') {
        const insumoRef = insumos.find((i: { id: any; }) => i.id === ing.idReferencia);
        if (insumoRef) nuevoCostoUnitario = Number(insumoRef.precioPorUnidad || insumoRef.precioCompra || 0);
      }
      return { ...ing, costoUnitario: nuevoCostoUnitario, costoTotal: ing.cantidad * nuevoCostoUnitario };
    });

    const recetaActualizada = { ...receta, ingredientes: nuevosIngredientes, costoTotal: nuevosIngredientes.reduce((sum: any, i: { costoTotal: any; }) => sum + i.costoTotal, 0) };

    try {
      const res = await fetch(`/api/local/recetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(recetaActualizada)
      });
      if (res.ok) {
        setRecetas((prev: any[]) => prev.map((r: { id: string; }) => r.id === idReceta ? recetaActualizada : r));
      }
    } catch (e) {
      console.error("Error refrescando costos:", e);
    }
  };

  const manejarActualizarReceta = async (actualizada: Receta) => {
    actualizada.flujoAprobacionId = actualizada.esSemielaborado ? 'f_semielaborado' : 'f1';
    const original = recetas.find((r: { id: string; }) => r.id === actualizada.id);
    let recetaFinal = actualizada;

    if (original) {
      if (original.estado === EstadoReceta.BORRADOR || original.estado === EstadoReceta.PENDIENTE_COSTOS || original.estado.includes('RECHAZADO')) {
        // Mantiene igual
      } else {
        const flujoAsignado = flujos.find(f => f.id === actualizada.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
        if (flujoAsignado.crearNuevaVersion === false) {
          // Actualiza sobre la misma versión/receta
          recetaFinal = actualizada;
        } else {
          const versionesMismoNombre = recetas.filter((r: { nombre: any; }) => r.nombre === original.nombre);
          const maxVersionActual = Math.max(...versionesMismoNombre.map((v: { versionActual: any; }) => v.versionActual), 0);
          recetaFinal = {
            ...actualizada,
            id: Math.random().toString(36).substr(2, 9),
            versionActual: maxVersionActual + 1,
            ultimoRegistroCambios: `Nueva versión v${maxVersionActual + 1} derivada de v${original.versionActual}`
          };
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/local/recetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        if (!original) {
          setRecetas((prev: any) => [...prev, recetaFinal]);
        } else if (recetaFinal.id === original.id) {
          setRecetas((prev: any[]) => prev.map((r: { id: string; }) => r.id === recetaFinal.id ? recetaFinal : r));
        } else {
          setRecetas((prev: any) => [...prev, recetaFinal]);
        }

        const esCambioAEnviarRevision = original && 
          (original.estado === EstadoReceta.BORRADOR || original.estado.includes('RECHAZADO')) &&
          recetaFinal.estado.startsWith('PENDIENTE_');

        if (esCambioAEnviarRevision) {
          const flujoAsignado = flujos.find(f => f.id === recetaFinal.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
          const pasosOrdenados = [...flujoAsignado.pasos].sort((a, b) => a.orden - b.orden);
          const primerPaso = pasosOrdenados[0];
          if (primerPaso) {
            enviarNotificacion(
              primerPaso.rolResponsable, 
              'Receta Enviada a Revisión', 
              `El chef ha enviado la receta "${recetaFinal.nombre}" para tu revisión inicial de ${primerPaso.etiqueta.toLowerCase()}.`, 
              'WARNING', 
              recetaFinal.id
            );
          }
        }

        setEditandoReceta(null);
      } else {
        alert("Error del servidor al guardar la receta. Revisa tu conexión o el formato de datos.");
      }
    } catch (e) {
      console.error("Error actualizando receta:", e);
      alert("Error de red intentando guardar la receta.");
    } finally {
      setSaving(false);
    }
  };

  const manejarEliminarReceta = async (id: string) => {
    const receta = recetas.find((r: { id: string; }) => r.id === id);
    if (!receta) return;

    if (receta.estado.startsWith('PENDIENTE_')) {
      alert("No se puede eliminar una receta que está pendiente de aprobación.");
      return;
    }

    if (receta.estado !== EstadoReceta.BORRADOR) {
      alert("No se puede eliminar la receta. Solo se permite eliminar versiones en estado Borrador.");
      return;
    }

    if (!window.confirm("¿Está seguro de que desea eliminar permanentemente esta receta y sus ingredientes?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/local/recetas/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setRecetas((prev: any[]) => prev.filter((r: { id: string; }) => r.id !== id));
      } else {
        alert("Error al intentar eliminar la receta en el servidor.");
      }
    } catch (e) {
      console.error("Error deleting recipe:", e);
      alert("Error de conexión al intentar eliminar la receta.");
    } finally {
      setSaving(false);
    }
  };

  const manejarGuardarFlujo = async (flujo: FlujoAprobacion) => {
    try {
      const res = await fetch(`/api/local/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(flujo)
      });
      if (res.ok) {
        setFlujos(prev => {
          const existe = prev.find(f => f.id === flujo.id);
          if (existe) return prev.map(f => f.id === flujo.id ? flujo : f);
          return [...prev, flujo];
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        const detallesMsg = errorData.detalles ? errorData.detalles.map((d: any) => `${d.campo}: ${d.mensaje}`).join(', ') : '';
        alert(`Error al guardar el flujo: ${errorData.error || res.statusText}. ${detallesMsg}`);
      }
    } catch (e) {
      console.error("Error guardando flujo:", e);
      alert("Error de conexión al guardar el flujo.");
    }
  };

  const manejarEliminarFlujo = async (id: string) => {
    try {
      const res = await fetch(`/api/local/workflows/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setFlujos(prev => prev.filter(f => f.id !== id));
      }
    } catch (e) {
      console.error("Error eliminando flujo:", e);
    }
  };

  const manejarAprobacion = async (idReceta: string, rolActual: Rol, codigoIngresado?: string) => {
    const currReceta = recetas.find((r: Receta) => r.id === idReceta);
    if (!currReceta) return;

    let recetaFinal = { ...currReceta };
    let siguienteEstado = currReceta.estado;
    const flujoAsignado = flujos.find(f => f.id === currReceta.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
    // Encontrar el paso activo de forma secuencial
    const pasosOrdenados = [...flujoAsignado.pasos].sort((a, b) => a.orden - b.orden);
    let pasoActual = null;
    let estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
    if (pasosOrdenados.length > 0) {
      const primerPaso = pasosOrdenados[0];
      if (primerPaso.rolResponsable === 'MKT') estadoAcumulado = EstadoReceta.PENDIENTE_MKT;
      else if (primerPaso.rolResponsable === 'CALIDAD') estadoAcumulado = EstadoReceta.PENDIENTE_CALIDAD;
      else estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
    }
    for (let i = 0; i < pasosOrdenados.length; i++) {
      const paso = pasosOrdenados[i];
      const estadoDelPaso = i === 0 ? estadoAcumulado : pasosOrdenados[i - 1].estadoDestino;
      if (estadoDelPaso === currReceta.estado) {
        pasoActual = paso;
        break;
      }
    }

    if (!pasoActual) {
      pasoActual = flujoAsignado.pasos.find(p => p.rolResponsable === rolActual);
    }

    if (pasoActual) siguienteEstado = pasoActual.estadoDestino;

    // MKT Auto-Bypass para Semielaborados
    if (currReceta.esSemielaborado && siguienteEstado === EstadoReceta.PENDIENTE_MKT) {
      const pasoMKT = flujoAsignado.pasos.find((p: any) => p.rolResponsable === 'MKT');
      if (pasoMKT) siguienteEstado = pasoMKT.estadoDestino;
    }

    if (siguienteEstado === EstadoReceta.APROBADO) {
      const snapshotIngredientes: IngredienteReceta[] = currReceta.ingredientes.map((ing: IngredienteReceta) => {
        let costoU = ing.costoUnitario;
        let version = null;
        if (ing.tipo === 'INSUMO') {
          const ins = insumos.find(i => i.id === ing.idReferencia);
          if (ins && (costoU === undefined || costoU === null)) costoU = Number(ins.precioPorUnidad || ins.precioCompra || 0);
        } else {
          const sub = recetas.find((sr: Receta) => sr.id === ing.idReferencia);
          if (sub) {
            const divisor = sub.tipoCosteo === 'GRAMO' ? (sub.pesoTotalCantidad || 1) : (sub.porcionesCantidad || 1);
            costoU = sub.costoTotalFinal / divisor;
            version = sub.versionActual;
          }
        }
        return { ...ing, snapshotCostoUnitario: costoU, snapshotVersion: version };
      });

      let mp = 0, emp = 0, mudi = currReceta.mudi || 0;
      snapshotIngredientes.forEach((ing: IngredienteReceta) => {
        const costo = (ing.snapshotCostoUnitario || 0) * ing.cantidad;
        const tipo = (ing.tipoMaterial || '').toUpperCase();
        if (tipo.includes('EMPAQUE')) emp += costo;
        else if (tipo.includes('MODI')) mudi += costo;
        else mp += costo;
      });

      const tasaMUDI = currReceta.tasaMUDI || 77;
      const tasaGIF = currReceta.tasaGIF || 83;
      const gif = tasaMUDI > 0 ? (mudi / tasaMUDI) * tasaGIF : 0;

      const base = mp + emp + mudi;
      const final = base + gif;
      const divisor = currReceta.tipoCosteo === 'GRAMO' ? (currReceta.pesoTotalCantidad || 1) : (currReceta.porcionesCantidad || 1);

      const snapshotCostos = {
        totalMP: mp, totalEMP: emp, totalMUDI: mudi, gif: gif,
        costoTotalBase: base, costoTotalFinal: final
      };

      const nuevaVersion: HistorialVersiones = {
        numeroVersion: currReceta.versionActual,
        fechaAprobacion: new Date().toISOString(),
        codigoCalidad: codigoIngresado || currReceta.codigoCalidad || '',
        registroCambios: currReceta.ultimoRegistroCambios,
        aprobadoPorCostos: rolActual === 'COSTOS' ? usuarioActual?.nombreCompleto || '' : 'N/A',
        aprobadoPorMkt: rolActual === 'MKT' ? usuarioActual?.nombreCompleto || '' : 'N/A',
        snapshotCostos
      };

      // Concatenación local para respuesta inmediata
      const partCalidad = (codigoIngresado || currReceta.codigoCalidad || '').trim();
      const partNombre = (currReceta.nombre_receta || currReceta.nombre || '').trim();
      const partNS = (currReceta.codigo_netsuite || '').trim();
      const detalleLocal = `${partCalidad} ${partNombre} ${partNS}`.replace(/\s+/g, ' ').trim();

      recetaFinal = {
        ...currReceta,
        estado: siguienteEstado,
        codigoCalidad: codigoIngresado || currReceta.codigoCalidad,
        ingredientes: snapshotIngredientes,
        totalMP: mp,
        totalEMP: emp,
        totalMUDI: mudi,
        gif: gif,
        costoTotalBase: base,
        costoTotalFinal: final,
        costoUnitarioMP: mp / divisor,
        costoUnitarioEMP: emp / divisor,
        costoUnitarioMUDI: mudi / divisor,
        detalle_nombre_receta: detalleLocal,
        versiones: [...currReceta.versiones, nuevaVersion],
        fechaRevision: new Date().toLocaleDateString('es-CR')
      };
    } else {
      recetaFinal = { ...recetaFinal, estado: siguienteEstado, codigoCalidad: codigoIngresado || currReceta.codigoCalidad };
    }

    try {
      const res = await fetch(`/api/local/recetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        setRecetas((prev: Receta[]) => prev.map((r: Receta) => r.id === idReceta ? recetaFinal : r));

        if (siguienteEstado === EstadoReceta.APROBADO) {
          enviarNotificacion('CHEF', 'Receta Aprobada', `La receta "${recetaFinal.nombre}" ha sido aprobada exitosamente y está en el Libro Oficial.`, 'SUCCESS', recetaFinal.id);
          enviarNotificacion('TODOS', 'Nueva Receta Aprobada', `La receta "${recetaFinal.nombre}" ya está disponible en el Libro de Recetas.`, 'INFO', recetaFinal.id);
        } else if (siguienteEstado !== currReceta.estado) {
          const pasosOrdenados = [...flujoAsignado.pasos].sort((a, b) => a.orden - b.orden);
          let pasoSiguiente = null;
          let estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
          if (pasosOrdenados.length > 0) {
            const primerPaso = pasosOrdenados[0];
            if (primerPaso.rolResponsable === 'MKT') estadoAcumulado = EstadoReceta.PENDIENTE_MKT;
            else if (primerPaso.rolResponsable === 'CALIDAD') estadoAcumulado = EstadoReceta.PENDIENTE_CALIDAD;
            else estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
          }
          for (let i = 0; i < pasosOrdenados.length; i++) {
            const paso = pasosOrdenados[i];
            const estadoDelPaso = i === 0 ? estadoAcumulado : pasosOrdenados[i - 1].estadoDestino;
            if (estadoDelPaso === siguienteEstado) {
              pasoSiguiente = paso;
              break;
            }
          }
          if (!pasoSiguiente) {
            pasoSiguiente = flujoAsignado.pasos.find(p => p.orden === (pasoActual?.orden || 0) + 1);
          }

          if (pasoSiguiente) {
            enviarNotificacion(pasoSiguiente.rolResponsable, 'Receta Pendiente de Revisión', `La receta "${recetaFinal.nombre}" fue aprobada por ${rolActual} y requiere tu validación.`, 'WARNING', recetaFinal.id);
          }
        }

      } else {
        alert("Error del servidor al intentar aprobar la receta.");
      }
    } catch (e) {
      console.error("Error aprobando receta", e);
      alert("Error de conexión al aprobar la receta.");
    }
  };

  const manejarRechazo = async (idReceta: string, rolActual: Rol) => {
    const r = recetas.find(rec => rec.id === idReceta);
    if (!r) return;

    let siguienteEstado = EstadoReceta.RECHAZADO_COSTOS;
    if (rolActual === 'MKT') siguienteEstado = EstadoReceta.RECHAZADO_MKT;
    if (rolActual === 'CALIDAD') siguienteEstado = EstadoReceta.RECHAZADO_CALIDAD;

    const recetaFinal = { ...r, estado: siguienteEstado };

    try {
      const res = await fetch("/api/local/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        setRecetas((prev: Receta[]) => prev.map((re: Receta) => re.id === idReceta ? recetaFinal : re));
        enviarNotificacion('CHEF', 'Receta Rechazada', `La receta "${recetaFinal.nombre}" fue rechazada por el área de ${rolActual}. Por favor, realiza las correcciones.`, 'DANGER', recetaFinal.id);
      }
    } catch (e) {
      console.error("Error rechazando receta", e);
    }
  };

  // --- HANDLERS FICHA TÉCNICA ---

  const manejarCrearFicha = () => {
    const nueva: FichaTecnica = {
      id: Math.random().toString(36).substr(2, 9),
      recetaId: '',
      nombreReceta: '',
      codigoCalidadPropio: '',
      estado: EstadoFicha.BORRADOR,
      version: 1,
      subsidiaria: 'Servicios de pastelería S.A',
      elaboradoPor: usuarioActual?.nombreCompleto || '',
      aprobadoPor: '',
      areaProduce: '',
      areaEmpaca: '',
      descripcionTecnica: '',
      declaracionIngredientes: '',
      alergenos: [],
      usoIntencional: '',
      consumidorObjetivo: '',
      restricciones: '',
      empaque: '',
      almacenamientoInterno: '',
      transporte: '',
      aspectoRechazo: '',
      almacenamientoPuntoVenta: '',
      vidaUtilCongelado: '',
      vidaUtilRefrigerado: '',
      vidaUtilAmbiente: '',
      pesoBruto: '',
      pesoNeto: '',
      pesoEtiqueta: '',
      requiereEtiquetaIngredientes: false,
      registroMS: '',
      codigoBarras: '',
      comentariosCalidad: '',
      fisicas: { largo: '', ancho: '', altura: '', diametro: '', acidezTotal: '', ph: '', phMin: '', phMax: '', humedad: '', densidad: '', densidadMin: '', densidadMax: '', brix: '', brixMin: '', brixMax: '' },
      organolepticas: { color: '', sabor: '', textura: '' },
      aspectosMicrobiologicos: [],
      requisitosLegales: '',
      imagenes: [],
      historialCambios: [{ fecha: new Date().toLocaleString(), usuario: rol, descripcion: 'Apertura de ficha técnica', version: 1 }],
      fechaCreacion: new Date().toLocaleString(),
      ultimaModificacion: new Date().toLocaleString()
    };
    setEditandoFicha(nueva);
  };

  const manejarGuardarFicha = async (actualizada: FichaTecnica) => {
    let fichaFinal = { ...actualizada };
    const existe = fichas.find((f: { id: string; }) => f.id === actualizada.id);

    if (existe && existe.estado === EstadoFicha.COMPLETA && actualizada.estado === EstadoFicha.COMPLETA) {
      fichaFinal = { ...actualizada, version: existe.version + 1, ultimaModificacion: new Date().toLocaleString() };
      fichaFinal.historialCambios = [...fichaFinal.historialCambios, { fecha: new Date().toLocaleString(), usuario: rol, descripcion: 'Nueva versión por actualización técnica', version: fichaFinal.version }];
    } else {
      fichaFinal.ultimaModificacion = new Date().toLocaleString();
    }

    setFichas((prev: any[]) => {
      const existeLocal = prev.find((f: { id: string; }) => f.id === fichaFinal.id);
      if (existeLocal) {
        return prev.map((f: { id: string; }) => f.id === fichaFinal.id ? fichaFinal : f);
      }
      return [...prev, fichaFinal];
    });

    try {
      await fetch(`/api/local/fichas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(fichaFinal)
      });
    } catch (e) {
      console.error("Error guardando ficha en BD", e);
      alert("La ficha se guardó localmente, pero hubo un error de conexión con la base de datos.");
    }

    setEditandoFicha(null);
  };

  const manejarInactivarFicha = async (id: string) => {
    const fichaInactivada = fichas.find(f => f.id === id);
    if (!fichaInactivada) return;

    const fichaFinal = { ...fichaInactivada, estado: EstadoFicha.INACTIVA };

    setFichas((prev: any[]) => prev.map((f: { id: string; }) => f.id === id ? fichaFinal : f));

    try {
      await fetch(`/api/local/fichas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(fichaFinal)
      });
    } catch (e) {
    }
  };

  const manejarEliminarFicha = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar permanentemente esta ficha técnica?")) return;

    try {
      const res = await fetch(`/api/local/fichas/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setFichas((prev: any[]) => prev.filter((f: { id: string; }) => f.id !== id));
      } else {
        alert("Error al intentar eliminar la ficha técnica.");
      }
    } catch (e) {
      console.error("Error eliminando ficha:", e);
    }
  };

  const recetasFiltradas = recetas.filter((r: any) =>
    r.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    (r.detalle_nombre_receta && r.detalle_nombre_receta.toLowerCase().includes(terminoBusqueda.toLowerCase())) ||
    (r.codigoCalidad && r.codigoCalidad.toLowerCase().includes(terminoBusqueda.toLowerCase())) ||
    (r.codigo_netsuite && r.codigo_netsuite.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  const recetasLibroUnicas = useMemo(() => {
    const aprobadas = recetas.filter((r: { estado: EstadoReceta; }) => r.estado === EstadoReceta.APROBADO);
    const grupos: Record<string, Receta> = {};
    const duplicados: Receta[] = [];
    aprobadas.forEach((r: Receta) => {
      const areaKey = (r.areaProduce || '').trim().toLowerCase();
      const key = `${r.nombre.toLowerCase().trim()}_${areaKey}`;
      if (!grupos[key]) {
        grupos[key] = r;
      } else {
        if (r.versionActual > grupos[key].versionActual) {
          const antigua = grupos[key];
          duplicados.push({
            ...antigua,
            areaProduce: 'Duplicados'
          });
          grupos[key] = r;
        } else {
          duplicados.push({
            ...r,
            areaProduce: 'Duplicados'
          });
        }
      }
    });
    return [...Object.values(grupos), ...duplicados];
  }, [recetas]);

  const filtrarRecetasAprobacion = (recetasList: Receta[], userRole: Rol) => {
    return recetasList.filter((r: Receta) => {
      if (!r.estado || !r.estado.startsWith('PENDIENTE_')) return false;
      if (userRole === 'ADMIN') return true;
      
      const flujoAsignado = flujos.find(f => f.id === r.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
      
      const pasosOrdenados = [...flujoAsignado.pasos].sort((a, b) => a.orden - b.orden);
      let pasoActual = null;
      let estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
      if (pasosOrdenados.length > 0) {
        const primerPaso = pasosOrdenados[0];
        if (primerPaso.rolResponsable === 'MKT') estadoAcumulado = EstadoReceta.PENDIENTE_MKT;
        else if (primerPaso.rolResponsable === 'CALIDAD') estadoAcumulado = EstadoReceta.PENDIENTE_CALIDAD;
        else estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
      }
      for (let i = 0; i < pasosOrdenados.length; i++) {
        const paso = pasosOrdenados[i];
        const estadoDelPaso = i === 0 ? estadoAcumulado : pasosOrdenados[i - 1].estadoDestino;
        if (estadoDelPaso === r.estado) {
          pasoActual = paso;
          break;
        }
      }
      
      if (pasoActual) {
        return pasoActual.rolResponsable === userRole;
      }
      
      // Fallback
      if (userRole === 'COSTOS') return r.estado === EstadoReceta.PENDIENTE_COSTOS;
      if (userRole === 'MKT') return r.estado === EstadoReceta.PENDIENTE_MKT;
      if (userRole === 'CALIDAD') return r.estado === EstadoReceta.PENDIENTE_CALIDAD;
      return false;
    });
  };
  const obtenerEtiquetaEstado = (r: Receta) => {
    if (!r.estado || !r.estado.startsWith('PENDIENTE_')) {
      return ETIQUETAS_ESTADO[r.estado] || r.estado;
    }
    const flujoAsignado = flujos.find(f => f.id === r.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
    
    const pasosOrdenados = [...flujoAsignado.pasos].sort((a, b) => a.orden - b.orden);
    let pasoActual = null;
    let estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
    if (pasosOrdenados.length > 0) {
      const primerPaso = pasosOrdenados[0];
      if (primerPaso.rolResponsable === 'MKT') estadoAcumulado = EstadoReceta.PENDIENTE_MKT;
      else if (primerPaso.rolResponsable === 'CALIDAD') estadoAcumulado = EstadoReceta.PENDIENTE_CALIDAD;
      else estadoAcumulado = EstadoReceta.PENDIENTE_COSTOS;
    }
    for (let i = 0; i < pasosOrdenados.length; i++) {
      const paso = pasosOrdenados[i];
      const estadoDelPaso = i === 0 ? estadoAcumulado : pasosOrdenados[i - 1].estadoDestino;
      if (estadoDelPaso === r.estado) {
        pasoActual = paso;
        break;
      }
    }
    
    if (pasoActual) {
      return pasoActual.etiqueta || ETIQUETAS_ESTADO[r.estado];
    }
    return ETIQUETAS_ESTADO[r.estado] || r.estado;
  };

  const conteoPendientes = filtrarRecetasAprobacion(recetas, rol).length + (rol === 'CALIDAD' ? fichas.filter((f: { estado: EstadoFicha; }) => f.estado === EstadoFicha.PENDIENTE_CALIDAD).length : 0);


  const itemsSidebar = [
    { id: 'panel', etiqueta: 'Inicio', icon: LayoutDashboard, roles: [rol] },
    { id: 'libro', etiqueta: 'Libro de Recetas', icon: BookOpen, roles: ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'ADMIN'] },
    { id: 'fichas', etiqueta: 'Fichas Técnicas', icon: FlaskConical, roles: ['CHEF', 'CALIDAD', 'ADMIN'] },
    { id: 'recetas', etiqueta: 'Taller de Recetas', icon: ClipboardList, roles: ['CHEF', 'ADMIN'] },
    { id: 'inventario', etiqueta: 'Insumos', icon: Package, roles: ['CHEF', 'COSTOS', 'COMPRAS', 'LOGISTICA', 'ADMIN'] },
    { id: 'aprobaciones', etiqueta: 'Aprobaciones', icon: CheckCircle2, roles: ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'ADMIN'], badge: conteoPendientes > 0 ? conteoPendientes : undefined },
    { id: 'admin', etiqueta: 'Administración', icon: Settings2, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(rol));

  // --- RENDERIZADO DE CARGA INICIAL ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-business-olive flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 bg-business-orange rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tight">GastroFlow Pro</h2>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-business-mustard" />
            <p className="text-sm font-bold text-business-beige/60 uppercase tracking-widest">Validando Sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO CONDICIONAL POR AUTH ---
  if (!usuarioActual) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Login onLogin={setUsuarioActual} />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-business-beige text-slate-800 font-sans flex-col md:flex-row">
      {/* Botón de Hamburguesa para Móvil */}
      <div className="md:hidden bg-business-olive text-white p-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <Utensils className="w-6 h-6 text-business-mustard" />
          <span className="font-bold tracking-tight">Maestro Recetas</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Settings2 />}
        </button>
      </div>


      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative ${isCollapsed ? 'w-20' : 'w-[225px]'} h-full bg-business-olive text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out`}>


        {/* Header Branding & Toggle */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-6 py-5'} border-b border-white/10 transition-all relative`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-business-orange rounded-lg shadow-lg shadow-business-orange/20 shrink-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in duration-300">Maestro Recetas</span>}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-3 top-7 bg-business-orange text-white p-1 rounded-full shadow-lg border-[2px] border-business-beige hover:bg-business-orange/90 transition-transform duration-300 z-50 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {itemsSidebar.map(item => (
            <button
              key={item.id}
              onClick={() => { navigate(item.id === 'panel' ? '/' : `/${item.id}`); setIsSidebarOpen(false); }}
              title={isCollapsed ? item.etiqueta : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg transition-all font-medium text-sm relative group ${vista === item.id ? 'bg-business-orange text-white shadow-md shadow-business-orange/10' : 'text-business-beige/70 hover:bg-white/10 hover:text-white'}`}
            >
              <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 transition-all`} />

              {!isCollapsed && (
                <span className="ml-3 truncate">{item.etiqueta}</span>
              )}

              {/* Badges */}
              {item.badge && (
                isCollapsed ? (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-business-olive"></span>
                ) : (
                  <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                )
              )}

              {/* Tooltip Hover for Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-business-olive text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {item.etiqueta}
                  <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-business-olive rotate-45 border-l border-b border-white/10"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer: Perfil y Logout (Ahora abajo) */}
        <div className="p-3 border-t border-white/10 bg-black/10 space-y-3 relative">

          {/* Notificaciones UI */}
          <div className="relative">
            <button
              onClick={() => { setMostrarNotificaciones(!mostrarNotificaciones); setShowUserMenu(false); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'} py-2 rounded-xl text-slate-600 hover:text-white hover:bg-slate-800/50 transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Bell className="w-5 h-5" />
                  {notificaciones.filter(n => !n.leida).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-900"></span>
                    </span>
                  )}
                </div>
                {!isCollapsed && <span className="text-sm font-medium">Notificaciones</span>}
              </div>
              {!isCollapsed && notificaciones.filter(n => !n.leida).length > 0 && (
                <span className="bg-rose-500 text-white text-sm font-bold px-2 py-0.5 rounded-full">{notificaciones.filter(n => !n.leida).length}</span>
              )}
            </button>

            {mostrarNotificaciones && (
              <div className="absolute bottom-full left-0 w-80 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[400px] animate-in slide-in-from-bottom-2 fade-in">
                <div className="p-3 border-b flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><Bell className="w-4 h-4 text-business-orange" /> Notificaciones</h3>
                    {notificaciones.some(n => !n.leida) && (
                      <button 
                        onClick={() => marcarTodasNotificacionesLeidas()} 
                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all border border-emerald-200 flex items-center justify-center"
                        title="Marcar todas como leídas"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button onClick={() => setMostrarNotificaciones(false)} className="p-1 hover:bg-business-beige rounded-full"><X className="w-4 h-4 text-slate-700" /></button>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                  {notificaciones.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-600">No tienes notificaciones.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 p-2 space-y-2">
                      {notificaciones.map(n => (
                        <div key={n.id} onClick={() => manejarClickNotificacion(n)} className={`p-4 rounded-2xl cursor-pointer transition-colors ${!n.leida ? 'bg-business-mustard/10 hover:bg-business-mustard/20' : 'opacity-70 hover:bg-business-beige'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.leida ? 'bg-business-orange shadow-[0_0_8px_rgba(239,142,25,0.5)]' : 'bg-transparent'}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm tracking-tight ${!n.leida ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.titulo}</p>
                              <p className="text-xs text-slate-700 mt-1 leading-relaxed line-clamp-2">{n.mensaje}</p>
                              <p className="text-sm text-slate-600 mt-2 font-medium">{new Date(n.fecha).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menú Desplegable de Logout */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full mb-2 px-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button
                onClick={async () => { await useStore.getState().logout(); setShowUserMenu(false); navigate('/'); }}
                className={`w-full bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-900/40 rounded-xl p-3 text-xs font-bold flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} transition-all`}
              >
                <Lock className="w-3.5 h-3.5" />
                {!isCollapsed && <span>Cerrar Sesión</span>}
              </button>
            </div>
          )}

          {/* User Profile Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-1'} py-2 rounded-xl transition-all hover:bg-slate-800/50 group outline-none focus:bg-slate-800/50`}
          >
            <div className="relative shrink-0">
              <img src={usuarioActual.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-slate-700 shadow-sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            {!isCollapsed && (
              <>
                <div className="overflow-hidden text-left flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight truncate text-slate-200">{usuarioActual.nombreCompleto}</p>
                  <span className="text-xs font-bold uppercase text-business-mustard mt-0.5 inline-block tracking-wide opacity-80">{usuarioActual.rol}</span>
                </div>
                <ChevronUp className={`w-3 h-3 text-slate-700 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-3 md:p-6 relative">
        <Routes>
          <Route path="/" element={<Panel recipes={recetas} insumos={insumos} role={rol} setView={(v: string) => navigate(v === 'panel' ? '/' : `/${v}`)} />} />
          <Route path="/libro" element={<VistaLibroRecetas recipes={recetasLibroUnicas} onSelect={(r: Receta) => setDetalleLibro(r)} configRoles={configRoles} />} />
          <Route path="/inventario" element={<VistaInventario insumos={insumos} onSave={manejarGuardarInsumo} role={rol} onDelete={(id: string) => setInsumos((p: any[]) => p.filter((i: { id: string; }) => i.id !== id))} fasesConfig={fasesInsumo} proveedores={proveedores} editandoId={editandoInsumoId} onClearEdit={() => setEditandoInsumoId(null)} />} />
          <Route path="/fichas" element={
            <VistaFichasTecnicas
              fichas={fichas}
              onEdit={(f) => setEditandoFicha(f)}
              onCreate={manejarCrearFicha}
              onInactivate={manejarInactivarFicha}
              onDelete={manejarEliminarFicha}
              allRecipes={recetas}
            />
          } />
          <Route path="/recetas" element={
            <ListaRecetas
              recipes={recetasFiltradas}
              searchTerm={terminoBusqueda}
              setSearchTerm={setTerminoBusqueda}
              onEdit={(r: any) => setEditandoReceta(r)}
              onCreate={manejarCrearReceta}
              onDelete={manejarEliminarReceta}
              role={rol}
              obtenerEtiquetaEstado={obtenerEtiquetaEstado}
            />
          } />
          <Route path="/aprobaciones" element={
            <VistaAprobaciones
              pendingRecipes={filtrarRecetasAprobacion(recetas, rol)}
              pendingFichas={rol === 'CALIDAD' ? fichas.filter((f: { estado: EstadoFicha; }) => f.estado === EstadoFicha.PENDIENTE_CALIDAD) : []}
              role={rol}
              onApprove={manejarAprobacion}
              onReject={manejarRechazo}
              onOpen={(r: any) => setEditandoReceta(r)}
              onRefreshCosts={manejarRefrescarCostos}
              onApproveFicha={(f: any) => setEditandoFicha(f)}
              obtenerEtiquetaEstado={obtenerEtiquetaEstado}
            />
          } />
          <Route path="/admin" element={
            <div className="space-y-8">
              <div className="flex gap-4 border-b pb-1">
                <button
                  onClick={() => setAdminTab('workflows')}
                  className={`px-6 py-3 font-black uppercase text-xs tracking-wider border-b-4 transition-all ${adminTab === 'workflows' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-600'}`}
                >
                  Configuración del Sistema
                </button>
                <button
                  onClick={() => setAdminTab('usuarios')}
                  className={`px-6 py-3 font-black uppercase text-xs tracking-wider border-b-4 transition-all ${adminTab === 'usuarios' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-600'}`}
                >
                  Gestión de Usuarios
                </button>
              </div>

              {adminTab === 'workflows' && (
                <AdminWorkflows
                  configRoles={configRoles}
                  setConfigRoles={setConfigRoles}
                  flujos={flujos}
                  setFlujos={setFlujos}
                  fasesInsumo={fasesInsumo}
                  setFasesInsumo={setFasesInsumo}
                  areasMaestras={areasMaestras}
                  setAreasMaestras={setAreasMaestras}
                  onSaveFlujo={manejarGuardarFlujo}
                  onDeleteFlujo={manejarEliminarFlujo}
                />
              )}

              {adminTab === 'usuarios' && (
                <GestionUsuarios configRoles={configRoles} />
              )}
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {editandoReceta && (
        <EditorReceta
          recipe={editandoReceta}
          insumos={insumos}
          subRecipes={recetas.filter((r: { esSemielaborado: any; nombre: any; }) => r.esSemielaborado && r.nombre !== editandoReceta.nombre)}
          insumosUnificados={insumosUnificados}
          flujosAprobacion={flujos}
          onClose={() => setEditandoReceta(null)}
          onSave={manejarActualizarReceta}
          onSaveInsumo={manejarGuardarInsumo}
          role={rol}
          areas={areasMaestras.map(a => a.nombre)}
          obtenerEtiquetaEstado={obtenerEtiquetaEstado}
        />
      )}
      {editandoFicha && (
        <EditorFichaTecnica
          ficha={editandoFicha}
          recetasDisponibles={recetas}
          onClose={() => setEditandoFicha(null)}
          onSave={manejarGuardarFicha}
          role={rol}
          maestroMicroorganismos={maestroMicroorganismos}
          setMaestroMicroorganismos={setMaestroMicroorganismos}
          areas={areasMaestras.map(a => a.nombre)}
        />
      )}

      {detalleLibro && (
        <VisorRecetaLibro
          recipe={detalleLibro}
          allRecipes={recetas}
          insumos={insumos}
          onClose={() => setDetalleLibro(null)}
          obtenerEtiquetaEstado={obtenerEtiquetaEstado}
          onRegisterPrint={(recipeId: string, printedDate: string) => {
            setRecetas((prev: any[]) => prev.map((r) => r.id === recipeId ? { ...r, fechaImpresion: printedDate } : r));
            setDetalleLibro((prev: any) => prev && prev.id === recipeId ? { ...prev, fechaImpresion: printedDate } : prev);
          }}
          configRoles={configRoles}
        />
      )}
    </div>
  );
}



// --- MÓDULO FICHA TÉCNICA AVANZADO ---




// --- OTROS COMPONENTES (Originales sin cambios significativos) ---






function ListaRecetas({ recipes, searchTerm, setSearchTerm, onEdit, onCreate, onDelete, role, obtenerEtiquetaEstado }: any) {
  const isLoadingData = useStore(state => state.isLoadingData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const normalizeArea = (rawArea: string) => {
    const a = (rawArea || '').trim().toLowerCase();
    if (a === 'cocina fría' || a === 'cocina fria') return 'Cocina Fría';
    if (a === 'cocina caliente') return 'Cocina Caliente';
    if (a === 'cocina' || a === 'cocina central') return 'Cocina';
    if (a === 'batidos') return 'Batidos';
    if (a.includes('premezcla') || a.includes('premezlca')) return 'Premezclas';
    if (a.includes('decoración') || a.includes('decoracoración') || a.includes('decoracion')) return 'Decoración';
    if (a === 'figuras') return 'Figuras';
    if (a === 'pastas') return 'Pastas';
    if (a.includes('marmita')) return 'Marmita';
    if (a === 'empaque') return 'Empaque';
    if (a.includes('postre') || a.includes('pastelería') || a.includes('pasteleria')) return 'Postres';
    return 'Área no definida';
  };

  const AREA_CONFIG: Record<string, { icon: any, color: string, bg: string, border: string }> = {
    'Borradores': { icon: FileEdit, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300 hover:border-slate-400 border-dashed' },
    'Pendientes': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300 hover:border-amber-400 border-dashed' },
    'Rechazadas': { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-300 hover:border-rose-400 border-dashed' },
    'Cocina Fría': { icon: Snowflake, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200 hover:border-sky-400' },
    'Cocina Caliente': { icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200 hover:border-rose-400' },
    'Cocina': { icon: ChefHat, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300 hover:border-slate-500' },
    'Batidos': { icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200 hover:border-amber-400' },
    'Premezclas': { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200 hover:border-indigo-400' },
    'Decoración': { icon: Palette, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200 hover:border-fuchsia-400' },
    'Figuras': { icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200 hover:border-yellow-400' },
    'Pastas': { icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200 hover:border-orange-400' },
    'Marmita': { icon: Factory, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200 hover:border-teal-400' },
    'Empaque': { icon: Package, color: 'text-business-olive', bg: 'bg-[#8e925b]/10', border: 'border-[#8e925b]/30 hover:border-[#8e925b]/60' },
    'Postres': { icon: Cake, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200 hover:border-pink-400' },
    'Área no definida': { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200 hover:border-slate-300' },
  };

  const groupedRecipes = useMemo(() => {
    const groups: Record<string, any[]> = {};
    Object.keys(AREA_CONFIG).forEach(k => groups[k] = []);
    
    recipes.forEach((r: any) => {
      let isDraft = r.estado === EstadoReceta.BORRADOR;
      let isPending = r.estado?.includes('PENDIENTE') || false;
      let isRejected = r.estado?.includes('RECHAZADO') || false;
      
      if (isDraft) groups['Borradores'].push(r);
      if (isPending) groups['Pendientes'].push(r);
      if (isRejected) groups['Rechazadas'].push(r);
      
      const groupName = normalizeArea(r.areaProduce);
      if (groupName && groups[groupName]) {
        groups[groupName].push(r);
      }
    });
    return groups;
  }, [recipes]);

  const filtradas = useMemo(() => {
    if (!selectedGroup) return [];
    return groupedRecipes[selectedGroup] || [];
  }, [groupedRecipes, selectedGroup]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      {!selectedGroup ? (
        // MENÚ DE ÁREAS PRINCIPAL
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Taller de Recetas</h2>
              <p className="text-slate-700 font-medium text-sm mt-0.5">Control de versiones y áreas productivas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input type="text" placeholder="Buscar en todas las áreas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none font-medium text-xs transition-all shadow-sm" />
              </div>
              {(role === 'CHEF' || role === 'ADMIN') && (
                <Button onClick={onCreate} className="w-full sm:w-auto shadow-md">
                  <Plus className="w-4 h-4" /> Nueva Receta
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(groupedRecipes).map(([areaName, areaRecipes]) => {
              const config = AREA_CONFIG[areaName];
              const Icon = config.icon;
              const count = (areaRecipes as any).length;
              
              if (count === 0 && areaName === 'Área no definida') return null;
              
              return (
                <div 
                  key={areaName}
                  onClick={() => setSelectedGroup(areaName)}
                  className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group p-6 flex flex-col items-center justify-center text-center h-40 ${config.bg} ${config.border}`}
                >
                  <div className={`p-3 rounded-full bg-white shadow-sm mb-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <h3 className={`text-sm font-black leading-tight uppercase ${config.color} tracking-widest`}>{areaName}</h3>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200/50">
                    {count} {count === 1 ? 'Receta' : 'Recetas'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // VISTA INTERIOR DEL ÁREA (GRID/LISTA)
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <button 
                onClick={() => setSelectedGroup(null)}
                className="mb-3 flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-business-orange transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:border-business-orange/30"
              >
                <ChevronLeft className="w-3 h-3" /> Volver al Menú
              </button>
              
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = AREA_CONFIG[selectedGroup]?.icon || HelpCircle;
                  return <Icon className={`w-6 h-6 ${AREA_CONFIG[selectedGroup]?.color || 'text-slate-400'}`} />
                })()}
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {selectedGroup}
                </h1>
              </div>
              <p className="text-slate-500 font-bold text-xs mt-1">
                Mostrando {filtradas.length} recetas en esta categoría
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex gap-0.5">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><ListIcon size={16} /></button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutGrid size={16} /></button>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input type="text" placeholder={`Buscar en ${selectedGroup}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none font-medium shadow-inner transition-all text-xs" />
              </div>
              {(role === 'CHEF' || role === 'ADMIN') && (
                <Button onClick={onCreate} className="w-full sm:w-auto shadow-sm">
                  <Plus className="w-4 h-4" /> Nueva
                </Button>
              )}
            </div>
          </header>

          {filtradas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">No hay recetas</h3>
              <p className="text-slate-500 text-sm font-medium">No se encontraron resultados en esta categoría.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoadingData ? (
                Array.from({ length: 4 }).map((_, i) => <div key={`skg-${i}`} className="h-40 bg-white rounded-2xl animate-pulse border border-slate-100"></div>)
              ) : filtradas.slice().reverse().map((r: any) => (
                <div key={r.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all group relative">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant={r.estado === EstadoReceta.APROBADO ? 'success' : r.estado?.includes('RECHAZADO') ? 'danger' : r.estado === EstadoReceta.BORRADOR ? 'neutral' : 'warning'}>
                        {obtenerEtiquetaEstado(r)}
                      </Badge>
                      <span className="text-sm font-black text-slate-700">v{r.versionActual}</span>
                    </div>
                    <div className="flex gap-2 items-start mb-2">
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-business-orange transition-colors">{r.nombre}</h3>
                      {r.codigoCalidad && <span className="text-[10px] text-business-orange bg-business-mustard/10 border border-business-mustard/30 px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap mt-1">{r.codigoCalidad}</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold mb-4 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> ID: {r.id}
                    </div>
                  </div>
                  <div className="border-t border-slate-50 pt-4 mt-auto flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-black text-slate-600 uppercase mb-0.5 tracking-widest">Costo Auditado</div>
                      <div className="font-black text-slate-900 text-lg tracking-tighter leading-none">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(r)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-business-olive transition-all shadow-md">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {(role === 'CHEF' || role === 'ADMIN') && r.estado === EstadoReceta.BORRADOR && (
                        <button onClick={() => onDelete(r.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto inner-scroll bg-white rounded-2xl shadow-sm border border-slate-100">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Nombre / Evolución</th>
                    <th className="px-6 py-4">Fase Actual</th>
                    <th className="px-6 py-4 text-right">Costo Auditado</th>
                    <th className="px-6 py-4 text-center">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingData ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="px-6 py-4"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/4" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-md" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-16 ml-auto mb-2" /><Skeleton className="h-4 w-20 ml-auto" /></td>
                        <td className="px-6 py-4 text-center"><Skeleton className="h-8 w-8 rounded-lg mx-auto" /></td>
                      </tr>
                    ))
                  ) : filtradas.slice().reverse().map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-2">
                        <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2">
                          {r.nombre}
                          {r.codigoCalidad && <span className="text-[9px] text-business-orange bg-business-mustard/10 border border-business-mustard/30 px-1.5 py-0.5 rounded uppercase tracking-widest">{r.codigoCalidad}</span>}
                        </div>
                        <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
                          <History className="w-2.5 h-2.5" /> v{r.versionActual}
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">ID: {r.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <Badge variant={r.estado === EstadoReceta.APROBADO ? 'success' : r.estado?.includes('RECHAZADO') ? 'danger' : r.estado === EstadoReceta.BORRADOR ? 'neutral' : 'warning'}>
                          {obtenerEtiquetaEstado(r)}
                        </Badge>
                      </td>
                      <td className="px-6 py-2 text-right">
                        <div className="font-black text-slate-900 text-sm leading-none">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</div>
                        <div className="text-[10px] font-black text-slate-600 uppercase mt-0.5">
                          Auditado: {r.fechaRevision ||
                            (r.versiones && r.versiones.length > 0
                              ? new Date(r.versiones[r.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR')
                              : 'Pendiente')}
                        </div>
                      </td>
                      <td className="px-6 py-2 text-center">
                        <Button onClick={() => onEdit(r)} variant="outline" size="sm" className="px-2 py-1 hover:bg-business-olive hover:text-white hover:border-business-olive text-business-orange text-center mx-auto">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        {(role === 'CHEF' || role === 'ADMIN') && r.estado === EstadoReceta.BORRADOR && (
                          <Button onClick={() => onDelete(r.id)} variant="outline" size="sm" className="px-2 py-1 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-rose-500 ml-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


