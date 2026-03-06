import React, { useState, useMemo, useEffect } from 'react';
import AdminWorkflows from './AdminWorkflows';
import VistaInventario from './VistaInventario';

import {
  Utensils, Package, ClipboardList, CheckCircle2, History, Plus, Trash2,
  Edit3,
  Eye,
  AlertCircle,
  TrendingUp,
  LayoutDashboard,
  Search,
  Save,
  X,
  FileText,
  BadgeCheck,
  Calculator,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Info,
  Clock,
  Bell,
  Scale,
  Check,
  Lock,
  Tag,
  Timer,
  Layers,
  Dna,
  Users,
  Warehouse,
  Building2,
  BookOpen,
  ArrowRight,
  Settings2,
  ShieldAlert,
  GitBranch,
  Key,
  ToggleRight,
  CheckSquare,
  FlaskConical,
  Activity,
  ArchiveX,
  Camera,
  Microscope,
  FileBadge2,
  ListIcon,
  LayoutGrid,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  FileUp,
  Truck,
  ArrowRightCircle,
  Coins, HandCoins, Factory, ChevronRight
} from 'lucide-react';
import { Receta, Insumo, EstadoReceta, EstadoInsumo, Rol, IngredienteReceta, ConfiguracionRol, Permiso, FlujoAprobacion, PasoFlujo, FichaTecnica, EstadoFicha, RegistroCambioFicha, AspectoMicrobiologico, FaseFluxoInsumo, HistorialVersiones } from './types';
import { ESTILOS_ESTADO, ETIQUETAS_ESTADO, ESTILOS_ESTADO_INSUMO, ETIQUETAS_ESTADO_INSUMO, UNIDADES, UNIDADES_STOCK, OPCIONES_IMPUESTO, TIPOS_MATERIAL, MAPA_CONVERSION_UNIDADES } from './constants';
import { optimizarPasosReceta } from './geminiService';

// --- Listas de Referencia ---
const PERSONAL_MOCK = ["Chef Antonio García", "Lucía Fernández (Pastelera)", "Elena Rodríguez (Costos)", "Carlos Mendoza (Marketing)", "Daniela Silva (Calidad)"];
const AREAS_PRODUCCION = ["Cocina Caliente", "Cuarto Frío", "Pastelería Industrial", "Panadería Artesanal", "Área de Mezclado"];
const AREAS_EMPAQUE = ["Línea de Empaque Primario", "Área de Etiquetado", "Zona de Despacho", "Cámaras de Refrigeración"];
const MICROORGANISMOS_INICIALES = ["Salmonella spp", "Listeria monocytogenes", "Escherichia coli", "Mohos y Levaduras", "Staphylococcus aureus"];
const PERMISOS_DISPONIBLES: Permiso[] = [
  'RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS',
  'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS',
  'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS'
];

const CONFIG_ROLES_INICIAL: ConfiguracionRol[] = [
  { rol: 'CHEF', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'GESTION_INSUMOS', 'FICHAS_TECNICAS'], color: 'bg-blue-500' },
  { rol: 'COSTOS', permisos: ['RECETAS_LECTURA', 'APROBAR_COSTOS', 'GESTION_INSUMOS'], color: 'bg-yellow-500' },
  { rol: 'MKT', permisos: ['RECETAS_LECTURA', 'APROBAR_MKT'], color: 'bg-orange-500' },
  { rol: 'CALIDAD', permisos: ['RECETAS_LECTURA', 'CERTIFICAR_CALIDAD', 'FICHAS_TECNICAS', 'GESTION_INSUMOS'], color: 'bg-purple-500' },
  { rol: 'COMPRAS', permisos: ['GESTION_INSUMOS'], color: 'bg-emerald-500' },
  { rol: 'LOGISTICA', permisos: ['GESTION_INSUMOS'], color: 'bg-orange-500' },
  { rol: 'ADMIN', permisos: ['RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS', 'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS', 'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS'], color: 'bg-slate-900' }
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
    locales: true,
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
    campos: ['nombre', 'tipoMaterial', 'unidad', 'unidadStock', 'pesoBruto', 'pesoNeto', 'precioCompra', 'tipoImpuesto', 'proveedor', 'codigoBarras', 'documentos', 'unidadConsumo', 'factorConversion', 'cantidadCompra', 'precioPorUnidad', 'cantidadConvertida']
  },
  {
    id: 'f2', orden: 2, nombre: 'Calidad', rolResponsable: 'CALIDAD', activo: true,
    campos: ['lote', 'alergenos', 'descripcionAlergenos']
  },
  {
    id: 'f3', orden: 3, nombre: 'Logística', rolResponsable: 'LOGISTICA', activo: true,
    campos: ['tipoAlmacenamiento', 'seccionAlisto', 'clasificacion', 'locales']
  }
];



import Login from './Login';
import AdminUsers from './AdminUsers';
import { Usuario } from './types';

// --- DATOS INICIALES MOCK USUARIOS ---
const USUARIOS_INICIALES: Usuario[] = [
  { id: 'u1', nombreUsuario: 'chef', email: 'chef@gastroflow.com', nombreCompleto: 'Antonio García', rol: 'CHEF', activo: true, avatar: 'https://ui-avatars.com/api/?name=Antonio+Garcia&background=ef4444&color=fff' },
  { id: 'u2', nombreUsuario: 'admin', email: 'admin@gastroflow.com', nombreCompleto: 'Admin Sistema', rol: 'ADMIN', activo: true, avatar: 'https://ui-avatars.com/api/?name=Admin+Sys&background=0f172a&color=fff' },
  { id: 'u3', nombreUsuario: 'costos', email: 'costos@gastroflow.com', nombreCompleto: 'Elena Rodríguez', rol: 'COSTOS', activo: true, avatar: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=10b981&color=fff' },
  { id: 'u4', nombreUsuario: 'mkt', email: 'mkt@gastroflow.com', nombreCompleto: 'Carlos Mendoza', rol: 'MKT', activo: true, avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=f59e0b&color=fff' },
  { id: 'u5', nombreUsuario: 'calidad', email: 'calidad@gastroflow.com', nombreCompleto: 'Daniela Silva', rol: 'CALIDAD', activo: true, avatar: 'https://ui-avatars.com/api/?name=Daniela+Silva&background=8b5cf6&color=fff' },
  { id: 'u6', nombreUsuario: 'compras', email: 'compras@gastroflow.com', nombreCompleto: 'Miguel Mercado', rol: 'COMPRAS', activo: true, avatar: 'https://ui-avatars.com/api/?name=Miguel+Mercado&background=10b981&color=fff' },
  { id: 'u7', nombreUsuario: 'logistica', email: 'logistica@gastroflow.com', nombreCompleto: 'Laura Logística', rol: 'LOGISTICA', activo: true, avatar: 'https://ui-avatars.com/api/?name=Laura+Logistica&background=f97316&color=fff' },
];

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>(USUARIOS_INICIALES);

  // Estados visuales originales
  const [vista, setVista] = useState<'panel' | 'recetas' | 'inventario' | 'aprobaciones' | 'libro' | 'fichas' | 'admin'>('panel');
  // Eliminamos estado 'rol' local, ahora deriva de usuarioActual
  const rol = usuarioActual?.rol || 'CHEF';

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>(insumosIniciales);
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [editandoReceta, setEditandoReceta] = useState<Receta | null>(null);
  const [editandoFicha, setEditandoFicha] = useState<FichaTecnica | null>(null);
  const [detalleLibro, setDetalleLibro] = useState<Receta | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Estados de Administración
  const [configRoles, setConfigRoles] = useState<ConfiguracionRol[]>(CONFIG_ROLES_INICIAL);
  const [flujos, setFlujos] = useState<FlujoAprobacion[]>([FLUJO_DEFAULT]);
  const [fasesInsumo, setFasesInsumo] = useState<FaseFluxoInsumo[]>(FASES_INSUMO_DEFAULT);
  const [maestroMicroorganismos, setMaestroMicroorganismos] = useState<string[]>(MICROORGANISMOS_INICIALES);

  // Tab Admin Interno
  const [adminTab, setAdminTab] = useState<'workflows' | 'usuarios'>('workflows');

  useEffect(() => {
    setVista('panel');
  }, [usuarioActual]);

  // CARGA DE DATOS DESDE API SQL
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar Recetas
        const resRecetas = await fetch("http://localhost:3001/api/local/recetas");
        if (resRecetas.ok) {
          const dataRecetas = await resRecetas.json();
          setRecetas(dataRecetas);
        }

        // 2. Cargar Insumos Locales
        let nuevosInsumosLocales = [];
        const resInsumosLocales = await fetch("http://localhost:3001/api/local/insumos/locales");
        if (resInsumosLocales.ok) {
          nuevosInsumosLocales = await resInsumosLocales.json();
        }

        // 3. Cargar Insumos NetSuite
        let nuevosInsumosNetSuite = [];
        const resNetSuite = await fetch("http://localhost:3001/api/articulos");
        if (resNetSuite.ok) {
          nuevosInsumosNetSuite = await resNetSuite.json();
          console.log("Datos NetSuite recibidos:", nuevosInsumosNetSuite.length);
        }

        setInsumos(() => {
          // Fusionar locales y externos evitando duplicados por ID
          const combined = [...nuevosInsumosLocales, ...nuevosInsumosNetSuite];
          const map = new Map();
          combined.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });

      } catch (error) {
        console.error("Error cargando todos los catálogos:", error);
      }
    };

    cargarDatos();
  }, []);

  const calcularCostoTotal = (ingredientes: IngredienteReceta[]) => {
    return ingredientes.reduce((suma, item) => suma + item.costoTotal, 0);
  };

  const manejarGuardarInsumo = async (insumo: Insumo) => {
    try {
      const res = await fetch("http://localhost:3001/api/local/insumos/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insumo)
      });
      if (res.ok) {
        // En actualizar estado local si la BD salvó bien
        setInsumos((prev: any[]) => {
          const existe = prev.find((i: { id: string; }) => i.id === insumo.id);
          if (existe) return prev.map((i: { id: string; }) => i.id === insumo.id ? insumo : i);
          return [...prev, insumo];
        });
      } else {
        console.error("Error al guardar Insumo en Backend.");
      }
    } catch (error) {
      console.error("Error de Red:", error);
    }
  };

  const manejarCrearReceta = () => {
    const flujoDefault = flujos.length > 0 ? flujos[0].id : '';
    const nuevaReceta: Receta = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: '',
      estado: EstadoReceta.BORRADOR,
      versionActual: 1,
      esSubReceta: false,
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
      tiempoPrepCantidad: 0,
      tiempoPrepUnidad: 'min',
      porcionesCantidad: 0,
      porcionesUnidad: 'porciones',
      pesoPorcionCantidad: 0,
      pesoPorcionUnidad: 'g',
      mermaCantidad: 0,
      mermaUnidad: '%',
      tipoCosteo: 'GRAMO',
      mudi: 0,
      gif: 0,
      totalMP: 0,
      totalEMP: 0,
      totalMUDI: 0,
      costoTotalBase: 0,
      costoTotalFinal: 0,
      costoUnitarioMP: 0,
      costoUnitarioEMP: 0,
      costoUnitarioMUDI: 0,
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
      const res = await fetch("http://localhost:3001/api/local/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const original = recetas.find((r: { id: string; }) => r.id === actualizada.id);
    let recetaFinal = actualizada;

    if (original) {
      if (original.estado === EstadoReceta.BORRADOR || original.estado === EstadoReceta.PENDIENTE_COSTOS) {
        // Mantiene igual
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

    try {
      const res = await fetch("http://localhost:3001/api/local/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        if (!original) {
          setRecetas((prev: any) => [...prev, recetaFinal]);
        } else if (original.estado === EstadoReceta.BORRADOR || original.estado === EstadoReceta.PENDIENTE_COSTOS) {
          setRecetas((prev: any[]) => prev.map((r: { id: string; }) => r.id === recetaFinal.id ? recetaFinal : r));
        } else {
          setRecetas((prev: any) => [...prev, recetaFinal]);
        }
        setEditandoReceta(null);
      } else {
        alert("Error del servidor al guardar la receta. Revisa tu conexión o el formato de datos.");
      }
    } catch (e) {
      console.error("Error actualizando receta:", e);
      alert("Error de red intentando guardar la receta.");
    }
  };

  const manejarAprobacion = async (idReceta: string, rolActual: Rol, codigoIngresado?: string) => {
    const currReceta = recetas.find((r: Receta) => r.id === idReceta);
    if (!currReceta) return;

    let recetaFinal = { ...currReceta };
    let siguienteEstado = currReceta.estado;
    const flujoAsignado = flujos.find(f => f.id === currReceta.flujoAprobacionId) || flujos.find(f => f.activo) || FLUJO_DEFAULT;
    const pasoActual = flujoAsignado.pasos.find(p => p.rolResponsable === rolActual);
    if (pasoActual) siguienteEstado = pasoActual.estadoDestino;

    if (siguienteEstado === EstadoReceta.APROBADO) {
      const snapshotIngredientes: IngredienteReceta[] = currReceta.ingredientes.map((ing: IngredienteReceta) => {
        let costoU = ing.costoUnitario;
        let version = null;
        if (ing.tipo === 'INSUMO') {
          const ins = insumos.find(i => i.id === ing.idReferencia);
          if (ins && (costoU === undefined || costoU === null)) costoU = Number(ins.precioPorUnidad || ins.precioCompra || 0);
        } else {
          const sub = recetas.find((sr: Receta) => sr.id === ing.idReferencia && sr.estado === EstadoReceta.APROBADO);
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

      const base = mp + emp + mudi;
      const final = base + (currReceta.gif || 0);
      const divisor = currReceta.tipoCosteo === 'GRAMO' ? (currReceta.pesoTotalCantidad || 1) : (currReceta.porcionesCantidad || 1);

      const snapshotCostos = {
        totalMP: mp, totalEMP: emp, totalMUDI: mudi, gif: currReceta.gif,
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

      recetaFinal = {
        ...recetaFinal,
        estado: siguienteEstado,
        codigoCalidad: nuevaVersion.codigoCalidad,
        ingredientes: snapshotIngredientes,
        totalMP: mp, totalEMP: emp, totalMUDI: mudi,
        costoTotalBase: base, costoTotalFinal: final,
        costoUnitarioMP: mp / divisor,
        costoUnitarioEMP: emp / divisor,
        costoUnitarioMUDI: mudi / divisor,
        versiones: [...currReceta.versiones, nuevaVersion]
      };
    } else {
      recetaFinal = { ...recetaFinal, estado: siguienteEstado, codigoCalidad: codigoIngresado || currReceta.codigoCalidad };
    }

    try {
      const res = await fetch("http://localhost:3001/api/local/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        setRecetas((prev: Receta[]) => prev.map((r: Receta) => r.id === idReceta ? recetaFinal : r));
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
      const res = await fetch("http://localhost:3001/api/local/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recetaFinal)
      });
      if (res.ok) {
        setRecetas((prev: Receta[]) => prev.map((re: Receta) => re.id === idReceta ? recetaFinal : re));
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

  const manejarGuardarFicha = (actualizada: FichaTecnica) => {
    setFichas((prev: any[]) => {
      const existe = prev.find((f: { id: string; }) => f.id === actualizada.id);
      if (existe) {
        if (existe.estado === EstadoFicha.COMPLETA) {
          const nuevaV = { ...actualizada, version: existe.version + 1, ultimaModificacion: new Date().toLocaleString() };
          nuevaV.historialCambios.push({ fecha: new Date().toLocaleString(), usuario: rol, descripcion: 'Nueva versión por actualización técnica', version: nuevaV.version });
          return prev.map((f: { id: string; }) => f.id === actualizada.id ? nuevaV : f);
        }
        return prev.map((f: { id: string; }) => f.id === actualizada.id ? actualizada : f);
      }
      return [...prev, actualizada];
    });
    setEditandoFicha(null);
  };

  const manejarInactivarFicha = (id: string) => {
    setFichas((prev: any[]) => prev.map((f: { id: string; }) => f.id === id ? { ...f, estado: EstadoFicha.INACTIVA } : f));
  };
  const recetasFiltradas = recetas.filter((r: { nombre: string; }) =>
    r.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  const recetasLibroUnicas = useMemo(() => {
    const aprobadas = recetas.filter((r: { estado: EstadoReceta; }) => r.estado === EstadoReceta.APROBADO);
    const grupos: Record<string, Receta> = {};
    aprobadas.forEach((r: Receta) => {
      if (!grupos[r.nombre] || r.versionActual > grupos[r.nombre].versionActual) {
        grupos[r.nombre] = r;
      }
    });
    return Object.values(grupos);
  }, [recetas]);

  const conteoPendientes = recetas.filter((r: { estado: EstadoReceta; }) =>
    (rol === 'COSTOS' && r.estado === EstadoReceta.PENDIENTE_COSTOS) ||
    (rol === 'MKT' && r.estado === EstadoReceta.PENDIENTE_MKT) ||
    (rol === 'CALIDAD' && r.estado === EstadoReceta.PENDIENTE_CALIDAD)
  ).length;


  const itemsSidebar = [
    { id: 'panel', etiqueta: 'Inicio', icon: LayoutDashboard, roles: [rol] },
    { id: 'libro', etiqueta: 'Libro de Recetas', icon: BookOpen, roles: ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'ADMIN'] },
    { id: 'fichas', etiqueta: 'Fichas Técnicas', icon: FlaskConical, roles: ['CHEF', 'CALIDAD', 'ADMIN'] },
    { id: 'recetas', etiqueta: 'Taller de Recetas', icon: ClipboardList, roles: ['CHEF'] },
    { id: 'inventario', etiqueta: 'Insumos', icon: Package, roles: ['CHEF', 'COSTOS', 'COMPRAS', 'LOGISTICA', 'ADMIN'] },
    { id: 'aprobaciones', etiqueta: 'Aprobaciones', icon: CheckCircle2, roles: ['COSTOS', 'MKT', 'CALIDAD'], badge: conteoPendientes > 0 ? conteoPendientes : undefined },
    { id: 'admin', etiqueta: 'Administración', icon: Settings2, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(rol));

  // --- RENDERIZADO CONDICIONAL POR AUTH ---
  if (!usuarioActual) {
    return <Login onLogin={setUsuarioActual} usuariosRegistrados={listaUsuarios} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans flex-col md:flex-row">
      {/* Botón de Hamburguesa para Móvil */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <Utensils className="w-6 h-6 text-indigo-500" />
          <span className="font-bold tracking-tight">Maestro Recetas</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Settings2 />}
        </button>
      </div>


      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative ${isCollapsed ? 'w-20' : 'w-[225px]'} h-full bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out`}>


        {/* Header Branding & Toggle */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-6 py-5'} border-b border-slate-800 transition-all relative`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 shrink-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in duration-300">Maestro Recetas</span>}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-3 top-7 bg-indigo-600 text-white p-1 rounded-full shadow-lg border-[2px] border-slate-50 hover:bg-indigo-700 transition-transform duration-300 z-50 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {itemsSidebar.map(item => (
            <button
              key={item.id}
              onClick={() => { setVista(item.id as any); setIsSidebarOpen(false); }}
              title={isCollapsed ? item.etiqueta : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg transition-all font-medium text-sm relative group ${vista === item.id ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 transition-all`} />

              {!isCollapsed && (
                <span className="ml-3 truncate">{item.etiqueta}</span>
              )}

              {/* Badges */}
              {item.badge && (
                isCollapsed ? (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
                ) : (
                  <span className="ml-auto bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{item.badge}</span>
                )
              )}

              {/* Tooltip Hover for Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  {item.etiqueta}
                  <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer: Perfil y Logout (Ahora abajo) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30 space-y-3 relative">

          {/* Menú Desplegable de Logout */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full mb-2 px-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button
                onClick={() => { setUsuarioActual(null); setShowUserMenu(false); }}
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
                  <span className="text-[9px] font-bold uppercase text-indigo-400 mt-0.5 inline-block tracking-wide opacity-80">{usuarioActual.rol}</span>
                </div>
                <ChevronUp className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-3 md:p-6 relative">
        {vista === 'panel' && <Panel recipes={recetas} insumos={insumos} role={rol} setView={setVista} />}
        {vista === 'libro' && <VistaLibroRecetas recipes={recetasLibroUnicas} onSelect={(r: Receta) => setDetalleLibro(r)} />}
        {vista === 'inventario' && <VistaInventario insumos={insumos} onSave={manejarGuardarInsumo} role={rol} onDelete={(id: string) => setInsumos((p: any[]) => p.filter((i: { id: string; }) => i.id !== id))} fasesConfig={fasesInsumo} />}
        {vista === 'fichas' && (
          <VistaFichasTecnicas
            fichas={fichas}
            onEdit={(f) => setEditandoFicha(f)}
            onCreate={manejarCrearFicha}
            onInactivate={manejarInactivarFicha}
            role={rol}
          />
        )}
        {vista === 'recetas' && (
          <ListaRecetas
            recipes={recetasFiltradas}
            searchTerm={terminoBusqueda}
            setSearchTerm={setTerminoBusqueda}
            onEdit={(r: any) => setEditandoReceta(r)}
            onCreate={manejarCrearReceta}
            role={rol}
          />
        )}

        {vista === 'aprobaciones' && (
          <VistaAprobaciones
            pendingRecipes={recetas.filter((r: { estado: EstadoReceta; }) =>
              (rol === 'COSTOS' && r.estado === EstadoReceta.PENDIENTE_COSTOS) ||
              (rol === 'MKT' && r.estado === EstadoReceta.PENDIENTE_MKT) ||
              (rol === 'CALIDAD' && r.estado === EstadoReceta.PENDIENTE_CALIDAD)
            )}
            role={rol}
            onApprove={manejarAprobacion}
            onReject={manejarRechazo}
            onOpen={(r: any) => setEditandoReceta(r)}
            onRefreshCosts={manejarRefrescarCostos}
          />
        )}
        {vista === 'admin' && (
          <div className="space-y-8">
            <div className="flex gap-4 border-b pb-1">
              <button
                onClick={() => setAdminTab('workflows')}
                className={`px-6 py-3 font-black uppercase text-xs tracking-wider border-b-4 transition-all ${adminTab === 'workflows' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                Configuración del Sistema
              </button>
              <button
                onClick={() => setAdminTab('usuarios')}
                className={`px-6 py-3 font-black uppercase text-xs tracking-wider border-b-4 transition-all ${adminTab === 'usuarios' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
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
              />
            )}

            {adminTab === 'usuarios' && (
              <AdminUsers
                usuarios={listaUsuarios}
                setUsuarios={setListaUsuarios}
                rolesDisponibles={configRoles.map((cr: { rol: any; }) => cr.rol)}
              />
            )}
          </div>
        )}
      </main>

      {editandoReceta && (
        <EditorReceta
          recipe={editandoReceta}
          insumos={insumos}
          subRecipes={recetas.filter((r: { esSemielaborado: any; esSubReceta: any; nombre: any; }) => (r.esSemielaborado || r.esSubReceta) && r.nombre !== editandoReceta.nombre)}
          flujosAprobacion={flujos}
          onClose={() => setEditandoReceta(null)}
          onSave={manejarActualizarReceta}
          onSaveInsumo={manejarGuardarInsumo}
          role={rol}
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
        />
      )}

      {detalleLibro && (
        <VisorRecetaLibro
          recipe={detalleLibro}
          allRecipes={recetas}
          insumos={insumos}
          onClose={() => setDetalleLibro(null)}
          role={rol}
        />
      )}
    </div>
  );
}



// --- MÓDULO FICHA TÉCNICA AVANZADO ---

function EditorFichaTecnica({ ficha, recetasDisponibles, onClose, onSave, role, maestroMicroorganismos, setMaestroMicroorganismos }: { ficha: FichaTecnica, recetasDisponibles: Receta[], onClose: () => void, onSave: (f: FichaTecnica) => void, role: Rol, maestroMicroorganismos: string[], setMaestroMicroorganismos: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [datos, setDatos] = useState<FichaTecnica>(ficha);
  const [tab, setTab] = useState<'descripcion' | 'fisicoquimica' | 'microbiologia' | 'historial'>('descripcion');

  const esChefEditable = role === 'CHEF' && (datos.estado === EstadoFicha.BORRADOR || datos.estado === EstadoFicha.INACTIVA);
  const esCalidadEditable = role === 'CALIDAD' && (datos.estado === EstadoFicha.PENDIENTE_CALIDAD || datos.estado === EstadoFicha.COMPLETA);
  const esSoloLectura = !esChefEditable && !esCalidadEditable;

  const manejarCambioFisico = (campo: keyof FichaTecnica['fisicas'], valor: string) => setDatos({ ...datos, fisicas: { ...datos.fisicas, [campo]: valor } });
  const manejarCambioOrganoleptico = (campo: keyof FichaTecnica['organolepticas'], valor: string) => setDatos({ ...datos, organolepticas: { ...datos.organolepticas, [campo]: valor } });

  const agregarMicro = () => setDatos({ ...datos, aspectosMicrobiologicos: [...datos.aspectosMicrobiologicos, { microorganismo: '', detalle: '' }] });
  const actualizarMicro = (index: number, campo: keyof AspectoMicrobiologico, valor: string) => {
    const nuevos = [...datos.aspectosMicrobiologicos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setDatos({ ...datos, aspectosMicrobiologicos: nuevos });
  };

  const handleGuardar = (enviar = false) => {
    let nEstado = datos.estado;
    if (enviar) {
      if (role === 'CHEF') nEstado = EstadoFicha.PENDIENTE_CALIDAD;
      if (role === 'CALIDAD') nEstado = EstadoFicha.COMPLETA;
    }
    // Sincronizar nuevos microorganismos con el maestro
    const nuevosMicro = datos.aspectosMicrobiologicos
      .map((m: { microorganismo: any; }) => m.microorganismo)
      .filter((m: string) => m && !maestroMicroorganismos.includes(m));

    if (nuevosMicro.length > 0) {
      setMaestroMicroorganismos((prev: any) => [...prev, ...nuevosMicro]);
    }

    onSave({ ...datos, estado: nEstado, ultimaModificacion: new Date().toLocaleString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-2 animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-[2rem] shadow-2xl flex flex-col max-h-[98vh] border overflow-hidden">
        {/* ENCABEZADO CORPORATIVO SOLICITADO */}
        <div className="p-4 border-b bg-slate-50/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20"><FlaskConical className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Ficha Técnica</h2>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{datos.subsidiaria}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Elaborado por</label>
              <input list="personal" disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg text-[11px] font-bold" value={datos.elaboradoPor} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, elaboradoPor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Aprobado por</label>
              <input list="personal" disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg text-[11px] font-bold" value={datos.aprobadoPor} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, aprobadoPor: e.target.value })} />
            </div>
            <datalist id="personal">{PERSONAL_MOCK.map(p => <option key={p} value={p} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Área Produce</label>
              <input list="areas-p" disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg text-[11px] font-bold" value={datos.areaProduce} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, areaProduce: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Área Empaca</label>
              <input list="areas-e" disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg text-[11px] font-bold" value={datos.areaEmpaca} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, areaEmpaca: e.target.value })} />
            </div>
            <datalist id="areas-p">{AREAS_PRODUCCION.map(a => <option key={a} value={a} />)}</datalist>
            <datalist id="areas-e">{AREAS_EMPAQUE.map(a => <option key={a} value={a} />)}</datalist>
          </div>
        </div>

        {/* TABS DE SECCIONES */}
        <div className="flex border-b bg-white px-6 space-x-8">
          {[
            { id: 'descripcion', label: 'Descripción', icon: FileText },
            { id: 'fisicoquimica', label: 'Física / Org.', icon: Activity },
            { id: 'microbiologia', label: 'Microbiología', icon: Microscope },
            { id: 'historial', label: 'Legal / Hist.', icon: ShieldCheck }
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`py-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border-b-4 transition-all ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'descripcion' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vínculo con Receta</label>
                  <select disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-bold text-base bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-100" value={datos.recetaId} onChange={(e: { target: { value: string; }; }) => { const r = recetasDisponibles.find(x => x.id === e.target.value); setDatos({ ...datos, recetaId: e.target.value, nombreReceta: r?.nombre || '' }); }}>
                    <option value="">Seleccione Receta...</option>
                    {recetasDisponibles.map(r => <option key={r.id} value={r.id}>{r.nombre} {r.esSemielaborado ? '(S)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vida Útil Congelado</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl font-bold text-sm" value={datos.vidaUtilCongelado} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, vidaUtilCongelado: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vida Útil Refrigerado</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl font-bold text-sm" value={datos.vidaUtilRefrigerado} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, vidaUtilRefrigerado: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vida Útil Ambiente</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl font-bold text-sm" value={datos.vidaUtilAmbiente} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, vidaUtilAmbiente: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Descripción Técnica</label>
                  <textarea disabled={esSoloLectura} rows={2} className="w-full p-2.5 border rounded-xl font-medium text-sm" value={datos.descripcionTecnica} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, descripcionTecnica: e.target.value })} placeholder="Definición técnica..." />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Comentarios de Calidad</label>
                  <textarea disabled={esSoloLectura} rows={1} className="w-full p-2 border rounded-xl font-medium text-sm text-indigo-700 bg-indigo-50/20" value={datos.comentariosCalidad} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, comentariosCalidad: e.target.value })} placeholder="Notas de calidad, alérgenos, etc..." />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Ingredientes (Resumen Declaración)</label>
                  <textarea disabled={esSoloLectura} rows={1} className="w-full p-2 border rounded-xl font-medium italic text-xs text-slate-600 bg-slate-50" value={datos.nombreReceta ? `Base Receta: ${datos.nombreReceta}` : ''} readOnly />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Uso Intencional</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.usoIntencional} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, usoIntencional: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Consumidor</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.consumidorObjetivo} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, consumidorObjetivo: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Restricciones</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.restricciones} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, restricciones: e.target.value })} />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-indigo-900 uppercase">Configuración de Pesos (g/kg)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input disabled={esSoloLectura} placeholder="Bruto" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoBruto} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoBruto: e.target.value })} />
                    <input disabled={esSoloLectura} placeholder="Neto" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoNeto} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoNeto: e.target.value })} />
                    <input disabled={esSoloLectura} placeholder="Etiqueta" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoEtiqueta} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoEtiqueta: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-indigo-900 uppercase block">Logística</label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled={esSoloLectura} checked={datos.requiereEtiquetaIngredientes} onChange={(e: { target: { checked: any; }; }) => setDatos({ ...datos, requiereEtiquetaIngredientes: e.target.checked })} className="w-4 h-4 rounded" id="labelreq" />
                    <label htmlFor="labelreq" className="text-[9px] font-black uppercase text-indigo-600">Etiqueta Ingredientes</label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-indigo-900 uppercase">Registro M.S.</label>
                  <input disabled={esSoloLectura} placeholder="Registro..." className="w-full p-2 border rounded-lg font-bold text-sm uppercase" value={datos.registroMS} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, registroMS: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'fisicoquimica' && (
            <><div className="space-y-8 animate-in fade-in">
              {[
                { k: 'largo', l: 'Largo' }, { k: 'ancho', l: 'Ancho' }, { k: 'altura', l: 'Altura' }, { k: 'diametro', l: 'Diám.' },
                { k: 'humedad', l: 'Hum.', qc: true }, { k: 'acidezTotal', l: 'Acidez', qc: true }
              ].map(f => (
                <div key={f.k}>
                  <label className={`text-[9px] font-black uppercase block mb-1 ${f.qc ? 'text-indigo-600' : 'text-slate-400'}`}>{f.l}</label>
                  <input disabled={f.qc ? !esCalidadEditable : esSoloLectura} className={`w-full p-2 border rounded-xl font-bold text-center text-sm ${f.qc ? 'bg-indigo-50/30' : 'bg-white'}`} value={(datos.fisicas as any)[f.k]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.k as any, e.target.value)} />
                </div>
              ))}
            </div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { k: 'ph', l: 'Potencial Hidrógeno (pH)', min: 'phMin', max: 'phMax' },
                  { k: 'brix', l: 'Grados Brix (°Bx)', min: 'brixMin', max: 'brixMax' },
                  { k: 'densidad', l: 'Densidad (g/ml)', min: 'densidadMin', max: 'densidadMax' }
                ].map(f => (
                  <div key={f.k} className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl space-y-3">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">{f.l}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Min</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border rounded-lg font-bold text-center text-xs" placeholder="Min" value={(datos.fisicas as any)[f.min]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.min as any, e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-600 uppercase text-center block">Target</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border border-indigo-200 rounded-lg font-black text-center text-sm bg-white" placeholder="Target" value={(datos.fisicas as any)[f.k]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.k as any, e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Max</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border rounded-lg font-bold text-center text-xs" placeholder="Max" value={(datos.fisicas as any)[f.max]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.max as any, e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div><div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Perfil Organoléptico</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['color', 'sabor', 'textura'].map(o => (
                    <div key={o}>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{o}</label>
                      <textarea disabled={esSoloLectura} rows={2} className="w-full p-2 border rounded-xl font-medium text-sm" value={(datos.organolepticas as any)[o]} onChange={(e: { target: { value: string; }; }) => manejarCambioOrganoleptico(o as any, e.target.value)} placeholder={`Nota de ${o}...`} />
                    </div>
                  ))}
                </div>
              </div></>
          )}

          {tab === 'microbiologia' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Análisis Microbiológico</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const nuevosCargar = maestroMicroorganismos.filter(m => !datos.aspectosMicrobiologicos.some((am: { microorganismo: string; }) => am.microorganismo === m));
                      if (nuevosCargar.length > 0) {
                        setDatos({
                          ...datos,
                          aspectosMicrobiologicos: [
                            ...datos.aspectosMicrobiologicos,
                            ...nuevosCargar.map(m => ({ microorganismo: m, detalle: '' }))
                          ]
                        });
                      }
                    }}
                    disabled={!esCalidadEditable}
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-black text-[8px] uppercase border border-indigo-100 transition"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Pre-cargar
                  </button>
                  <button onClick={agregarMicro} disabled={!esCalidadEditable} className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-[8px] uppercase hover:bg-slate-800 transition"><Plus className="w-3.5 h-3.5" /> Agregar</button>
                </div>
              </div>
              <div className="border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                    <tr><th className="px-4 py-2">Microorganismo</th><th className="px-4 py-2">Límite</th><th className="px-4 py-2 text-center">---</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.aspectosMicrobiologicos.map((m: { microorganismo: any; detalle: any; }, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-1.5">
                          <input list="micros-list" disabled={!esCalidadEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white text-xs" value={m.microorganismo} onChange={(e: { target: { value: string; }; }) => actualizarMicro(i, 'microorganismo', e.target.value)} />
                        </td>
                        <td className="px-4 py-1.5"><input disabled={!esCalidadEditable} className="w-full p-1.5 border rounded-lg text-xs" value={m.detalle} onChange={(e: { target: { value: string; }; }) => actualizarMicro(i, 'detalle', e.target.value)} /></td>
                        <td className="px-4 py-1.5 text-center">
                          <button disabled={!esCalidadEditable} onClick={() => { const nuevos = datos.aspectosMicrobiologicos.filter((_: any, idx: any) => idx !== i); setDatos({ ...datos, aspectosMicrobiologicos: nuevos }); }} className="p-1 px-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'historial' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 uppercase">Reglamentación</h3>
                <textarea disabled={esSoloLectura} rows={4} className="w-full p-3 border rounded-2xl font-medium text-sm text-slate-600 bg-slate-50/30" value={datos.requisitosLegales} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, requisitosLegales: e.target.value })} placeholder="Normativas aplicables..." />

                <div className="p-4 bg-slate-900 rounded-2xl border space-y-3">
                  <label className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Certificación Final</label>
                  <div className="flex gap-2">
                    <input disabled={!esCalidadEditable} className="flex-1 p-2 rounded-lg font-black text-lg bg-slate-800 text-white" placeholder="QC-PASS" value={datos.codigoCalidadPropio} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, codigoCalidadPropio: e.target.value })} />
                    <div className="p-2.5 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><ShieldCheck className="w-6 h-6" /></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 uppercase">Evidencia</h3>
                <div className="grid grid-cols-3 gap-2">
                  {datos.imagenes.map((img: any, i: any) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button onClick={() => setDatos({ ...datos, imagenes: datos.imagenes.filter((_: any, idx: any) => idx !== i) })} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-200 text-slate-300 transition-all">
                    <Camera className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase">Subir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e: { target: { files: any[]; }; }) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setDatos({ ...datos, imagenes: [...datos.imagenes, ev.target?.result as string] });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50/80 flex justify-between items-center rounded-b-[2rem]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black text-[10px]">v{datos.version}</div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Última Modificación</p>
              <p className="text-[8px] font-bold text-slate-500 italic mt-0.5">{datos.ultimaModificacion}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-6 py-2 bg-white border text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-50">Cerrar</button>
            {!esSoloLectura && (
              <>
                <button onClick={() => handleGuardar()} className="px-6 py-2 bg-slate-200 text-slate-700 font-black uppercase text-[10px] rounded-xl hover:bg-slate-300">Guardar Avance</button>
                <button onClick={() => handleGuardar(true)} className="px-8 py-2 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-indigo-700 flex items-center gap-2">
                  {role === 'CHEF' ? <ArrowRight className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {role === 'CHEF' ? 'Enviar a Calidad' : 'Certificar'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VistaFichasTecnicas({ fichas, onEdit, onCreate, onInactivate, role }: { fichas: FichaTecnica[], onEdit: (f: FichaTecnica) => void, onCreate: () => void, onInactivate: (id: string) => void, role: Rol }) {
  const filtradas = fichas.filter(f => f.estado !== EstadoFicha.INACTIVA || role === 'ADMIN');
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-indigo-600" />
            Repositorio de Fichas Técnicas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 italic">Certificación legal, física y microbiológica de productos terminados.</p>
        </div>
        {(role === 'CHEF' || role === 'ADMIN') && (
          <button onClick={onCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
            <Plus className="w-4 h-4" /> Iniciar Ficha
          </button>
        )}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtradas.map(f => (
          <div key={f.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all flex flex-col relative overflow-hidden">
            {f.estado === EstadoFicha.INACTIVA && <div className="absolute top-0 right-0 p-2 bg-rose-500 text-white font-black text-[8px] uppercase tracking-widest rounded-bl-xl">Archivada</div>}
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm ${f.estado === EstadoFicha.COMPLETA ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {f.estado.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-black text-slate-300">v{f.version}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight mb-1">{f.nombreReceta}</h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">{f.subsidiaria}</p>
            <div className="flex items-center gap-2 mb-4">
              <img src={`https://ui-avatars.com/api/?name=${f.elaboradoPor}&background=f1f5f9&color=6366f1`} className="w-5 h-5 rounded-full border" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Elaborado</span>
                <span className="text-[9px] font-bold text-slate-600">{f.elaboradoPor}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => onEdit(f)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] hover:bg-slate-800 transition-all">
                <Edit3 className="w-3.5 h-3.5" /> Gestionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- OTROS COMPONENTES (Originales sin cambios significativos) ---

function Panel({ recipes, insumos, role, setView }: any) {
  const estadisticas = [
    { label: 'Versiones Totales', value: recipes.length, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', vista: 'recetas' },
    { label: 'Vigentes Aprobadas', value: new Set(recipes.filter((r: any) => r.estado === EstadoReceta.APROBADO).map((r: any) => r.nombre)).size, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', vista: 'libro' },
    { label: 'Insumos', value: insumos.length, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', vista: 'inventario' },
    { label: 'En Revisión', value: recipes.filter((r: any) => r.estado.includes('PENDIENTE')).length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', vista: 'aprobaciones' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-indigo-600" />
          Panel de Control
        </h1>
        <p className="text-slate-500 font-medium text-[11px] mt-1 italic uppercase tracking-wider">Perfil: <span className="text-indigo-600 font-black">{role}</span></p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {estadisticas.map((stat, i) => (
          <div key={i} onClick={() => setView(stat.vista)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VistaLibroRecetas({ recipes, onSelect }: any) {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filtradas = useMemo(() => {
    return recipes.filter((r: any) =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) &&
      (areaFilter === '' || r.areaProduce === areaFilter)
    );
  }, [recipes, search, areaFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" /> Libro de Recetas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 italic">Versiones finales aprobadas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex gap-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><ListIcon size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid size={16} /></button>
          </div>
          <div className="relative w-full sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select value={areaFilter} onChange={(e: { target: { value: any; }; }) => setAreaFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-600 appearance-none shadow-sm transition-all text-xs">
              <option value="">Todas las Áreas</option>
              {AREAS_PRODUCCION.map(area => (<option key={area} value={area}>{area}</option>))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e: { target: { value: any; }; }) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium shadow-sm transition-all text-xs" />
          </div>
        </div>
      </header>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtradas.map((r: any) => (
            <div key={r.id} onClick={() => onSelect(r)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">Vigente</span>
                  <span className="text-[9px] font-black text-slate-300">v{r.versionActual}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors leading-tight">{r.nombre}</h3>
                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase">
                  <span className="flex items-center gap-1"><Clock size={12} /> {r.tiempoPrepCantidad}m</span>
                  <span className="flex items-center gap-1"><Scale size={12} /> {r.pesoTotalCantidad}g</span>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="font-black text-slate-900 text-xl tracking-tighter">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</span>
                <button className="p-2 bg-slate-950 text-white rounded-lg group-hover:bg-indigo-600 transition-all shadow-md"><ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase">
                <tr>
                  <th className="px-6 py-3 tracking-widest">Nombre / Área</th>
                  <th className="px-6 py-3 tracking-widest">Especificaciones</th>
                  <th className="px-6 py-3 tracking-widest text-right">Costo Total</th>
                  <th className="px-6 py-3 tracking-widest text-center">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtradas.map((r: any) => (
                  <tr key={r.id} onClick={() => onSelect(r)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-3">
                      <div className="font-black text-slate-900 text-base leading-none">{r.nombre}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">{r.areaProduce || 'Sin Área'}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-4 items-center">
                        <span className="font-bold text-slate-600 flex items-center gap-1"><Clock size={12} className="text-indigo-400" /> {r.tiempoPrepCantidad}m</span>
                        <span className="font-bold text-slate-600 flex items-center gap-1"><Scale size={12} className="text-indigo-400" /> {r.pesoTotalCantidad}g</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-black text-slate-900 text-lg tracking-tighter">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</td>
                    <td className="px-6 py-3 text-center"><button className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"><ArrowRight size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VisorRecetaLibro({ recipe, allRecipes, insumos, onClose, role }: { recipe: Receta, allRecipes: Receta[], insumos: Insumo[], onClose: () => void, role: Rol }) {
  const [tab, setTab] = useState<'info' | 'preparacion' | 'historial'>('info');
  const [recetaActiva, setRecetaActiva] = useState<Receta>(recipe);

  // Filtramos todas las versiones físicas guardadas que tienen el mismo nombre
  const versionesGuardadas = useMemo(() => {
    return allRecipes
      .filter(r => r.nombre === recipe.nombre)
      .sort((a, b) => b.versionActual - a.versionActual);
  }, [allRecipes, recipe.nombre]);

  const ingredientesCategorizados = useMemo(() => {
    const grupos = {
      materiasPrimas: [] as IngredienteReceta[],
      empaque: [] as IngredienteReceta[],
      modi: [] as IngredienteReceta[]
    };

    recetaActiva.ingredientes.forEach((ing: IngredienteReceta) => {
      if (ing.tipo === 'SUBRECETA') {
        grupos.materiasPrimas.push(ing);
      } else {
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        const tipo = (ing.tipoMaterial || ins?.tipoMaterial || '').toUpperCase();
        if (tipo.includes('EMPAQUE')) {
          grupos.empaque.push(ing);
        } else if (tipo.includes('MODI')) {
          grupos.modi.push(ing);
        } else {
          grupos.materiasPrimas.push(ing);
        }
      }
    });

    return grupos;
  }, [recetaActiva.ingredientes, insumos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border overflow-hidden">
        {/* Encabezado del Visor */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl"><BookOpen className="w-6 h-6" /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{recetaActiva.nombre}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${ESTILOS_ESTADO[recetaActiva.estado]}`}>
                  {ETIQUETAS_ESTADO[recetaActiva.estado].toUpperCase()}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border px-2 py-0.5 rounded-md">v{recetaActiva.versionActual}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white px-6 space-x-8">
          {['info', 'preparacion', 'historial'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300'}`}
            >
              {t === 'info' ? 'Ficha' : t === 'preparacion' ? 'Proceso' : 'Versiones'}
            </button>
          ))}
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white space-y-8">
          {tab === 'info' && (
            <div className="space-y-8 animate-in fade-in">
              {/* Resumen Administrativo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border rounded-2xl">
                <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Subsidiaria</p><p className="font-bold text-xs">{recetaActiva.subsidiaria}</p></div>
                <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Elaborado Por</p><p className="font-bold text-xs">{recetaActiva.elaboradoPor || '---'}</p></div>
                <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Producción</p><p className="font-bold text-xs">{recetaActiva.areaProduce || 'Cocina Central'}</p></div>
                <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Empaque</p><p className="font-bold text-xs">{recetaActiva.areaEmpaca || 'Línea 1'}</p></div>
              </div>

              {/* Matriz de Ingredientes */}
              <div className="space-y-3">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-600" /> Composición</h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-4 py-2">Ingrediente</th>
                        <th className="px-4 py-2 text-center">Cant / Unidad</th>
                        <th className="px-4 py-2 text-center">Marca / Obs.</th>
                        <th className="px-4 py-2 text-right">Unitario</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'Materias Primas & Semielaborados', data: ingredientesCategorizados.materiasPrimas },
                        { label: 'Empaque', data: ingredientesCategorizados.empaque },
                        { label: 'MODI', data: ingredientesCategorizados.modi }
                      ].map(seccion => seccion.data.length > 0 && (
                        <React.Fragment key={seccion.label}>
                          <tr className="bg-slate-50/50">
                            <td colSpan={5} className="px-4 py-1.5 text-[8px] font-black text-indigo-600 uppercase tracking-widest">{seccion.label}</td>
                          </tr>
                          {seccion.data.map((ing: { snapshotCostoUnitario: number; costoUnitario: number; id: any; nombre: any; codigoNetSuite: any; cantidad: any; unidad: any; marca: any; costoTotal: number; }) => {
                            const diff = ing.snapshotCostoUnitario ? ((ing.costoUnitario - ing.snapshotCostoUnitario) / ing.snapshotCostoUnitario) * 100 : 0;
                            return (
                              <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2">
                                  <div className="font-black text-slate-800 text-xs">{ing.nombre}</div>
                                  <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{ing.codigoNetSuite}</div>
                                </td>
                                <td className="px-4 py-2 text-center font-black">{ing.cantidad} {ing.unidad}</td>
                                <td className="px-4 py-2 text-center text-slate-500 font-medium italic text-[9px]">{ing.marca || 'N/A'}</td>
                                {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') ? (
                                  <>
                                    <td className="px-4 py-2 text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="font-bold text-slate-400">{ing.costoUnitario.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</span>
                                        {ing.snapshotCostoUnitario && (
                                          <span className="text-[7px] font-black text-indigo-400 uppercase">Audit: {(ing.snapshotCostoUnitario || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      <div className="flex flex-col items-end">
                                        <span className={`font-black ${Math.abs(diff) > 5 ? 'text-rose-600' : 'text-slate-900'}`}>{ing.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</span>
                                        {Math.abs(diff) > 0.1 && (
                                          <span className={`text-[7px] font-black uppercase ${diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs Audit
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-4 py-2 text-right text-slate-300 font-bold">$***</td>
                                    <td className="px-4 py-2 text-right font-black text-slate-300">$***</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50/20">
                            <td colSpan={4} className="px-4 py-1 text-right text-[8px] font-bold text-slate-400 uppercase">Subtotal {seccion.label}</td>
                            <td className="px-4 py-1 text-right font-black text-slate-600 text-xs">
                              {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') ? seccion.data.reduce((s: any, i: { costoTotal: any; }) => s + i.costoTotal, 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' }) : '₡***'}
                            </td>
                          </tr>
                          {/* Snapshot values for audit (Visible only if user is COSTOS) */}
                          {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && ingredientesCategorizados.materiasPrimas.concat(ingredientesCategorizados.empaque, ingredientesCategorizados.modi).some((i: { snapshotCostoUnitario: any; }) => i.snapshotCostoUnitario) && (
                            <tr className="bg-amber-50/30">
                              <td colSpan={5} className="px-4 py-1 text-[7px] font-bold uppercase text-amber-600 italic tracking-widest">Dato Histórico: Snapshot de costos capturado en aprobación</td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      <tr className="bg-slate-50 font-black text-indigo-600 border-t-2 border-indigo-100">
                        <td colSpan={4} className="px-4 py-3 uppercase text-[9px] tracking-widest">COSTO TOTAL PRODUCCIÓN</td>
                        <td className="px-4 py-3 text-right text-base">
                          {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') ? recetaActiva.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' }) : '₡***'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Datos de Rendimiento */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Peso Total</p>
                  <p className="text-lg font-black text-slate-900">{recetaActiva.pesoTotalCantidad} {recetaActiva.pesoTotalUnidad}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Tiempo Prep.</p>
                  <p className="text-lg font-black text-slate-900">{recetaActiva.tiempoPrepCantidad} {recetaActiva.tiempoPrepUnidad}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Porciones</p>
                  <p className="text-lg font-black text-slate-900">{recetaActiva.porcionesCantidad} {recetaActiva.porcionesUnidad}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Peso Porción</p>
                  <p className="text-lg font-black text-slate-900">{recetaActiva.pesoPorcionCantidad} {recetaActiva.pesoPorcionUnidad}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Merma %</p>
                  <p className="text-lg font-black text-rose-500">{recetaActiva.mermaCantidad}{recetaActiva.mermaUnidad}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'preparacion' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Guía de Elaboración Paso a Paso
              </h3>
              {recetaActiva.pasos.map((paso: any, idx: number) => (
                <div key={idx} className="flex gap-8 items-start p-8 bg-slate-50 border rounded-\[2rem] hover:border-indigo-200 transition-all">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0">{idx + 1}</div>
                  <div className="flex-1 text-slate-700 font-medium text-lg leading-relaxed">{paso}</div>
                </div>
              ))}
              {recetaActiva.pasos.length === 0 && (
                <div className="text-center py-20 opacity-20">No hay pasos registrados para esta versión de la receta.</div>
              )}
            </div>
          )}

          {tab === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <History className="w-6 h-6 text-indigo-600" />
                Cronograma de Evolución y Copias
              </h3>
              <div className="relative pl-10 border-l-2 border-slate-100 space-y-12">
                {versionesGuardadas.map((v: { id: any; versionActual: any; estado: string | number; ultimoRegistroCambios: any; costoTotal: number; ingredientes: string | any[]; }) => (
                  <div key={v.id} className="relative group">
                    <div className={`absolute -left-\[51px] top-0 w-10 h-10 ${v.id === recetaActiva.id ? 'bg-indigo-600' : 'bg-slate-200'} text-white rounded-xl flex items-center justify-center font-black shadow-lg transition-colors`}>
                      v{v.versionActual}
                    </div>
                    <div className={`bg-white border rounded-\[2.5rem] p-8 shadow-sm group-hover:shadow-xl transition-all ${v.id === recetaActiva.id ? 'ring-2 ring-indigo-600' : ''}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-\[10px] text-slate-400 font-black uppercase tracking-widest">Estado: {ETIQUETAS_ESTADO[v.estado]}</p>
                          <p className="text-xl font-black text-slate-900 mt-1">ID Único: {v.id}</p>
                        </div>
                        <div className="flex gap-3">
                          {v.id === recetaActiva.id ? (
                            <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-\[9px] font-black uppercase flex items-center gap-1"><Eye className="w-3 h-3" /> Visualizando</span>
                          ) : (
                            <button
                              onClick={() => setRecetaActiva(v)}
                              className="bg-slate-900 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase hover:bg-indigo-600 transition-all"
                            >
                              Ver esta versión
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl">
                        <p className="text-\[10px] text-slate-400 font-black uppercase mb-2">Resumen de Cambios:</p>
                        <p className="text-slate-600 font-medium leading-relaxed italic">"{v.ultimoRegistroCambios || 'Sin descripción detallada'}"</p>
                      </div>
                      <div className="mt-6 flex gap-10">
                        <div><p className="text-\[9px] text-slate-400 font-bold uppercase">Costo Total</p><p className="text-xs font-black">{v.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p></div>
                        <div><p className="text-\[9px] text-slate-400 font-bold uppercase">Ingredientes</p><p className="text-xs font-black">{v.ingredientes.length} items</p></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Visor */}
        <div className="p-6 border-t bg-slate-50/80 flex justify-between items-center rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seguridad GastroFlow</p>
              <p className="text-[8px] font-bold text-slate-400 italic">Auditado técnicamente</p>
            </div>
          </div>
          <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
            Cerrar Consulta
          </button>
        </div>
      </div>
    </div>
  );
}


function EditorReceta({ recipe, insumos, subRecipes, flujosAprobacion, onClose, onSave, onSaveInsumo, role }: any) {
  const [datosForm, setDatosForm] = useState<Receta>(recipe);
  const [tabActiva, setTabActiva] = useState<'ficha' | 'pasos' | 'historial'>('ficha');
  const [nuevoPaso, setNuevoPaso] = useState('');
  const [nombreTmp, setNombreTmp] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState(1);
  const [unidadIngrediente, setUnidadIngrediente] = useState('kg');
  const [esProductoNuevo, setEsProductoNuevo] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [codigoNetSuite, setCodigoNetSuite] = useState('');
  const [descripcionDetalle, setDescripcionDetalle] = useState('');
  const [marca, setMarca] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [nombreInterno, setNombreInterno] = useState('');
  const [idReferenciaInterno, setIdReferenciaInterno] = useState('');
  const [tipoMaterialIngrediente, setTipoMaterialIngrediente] = useState('');
  const [costoUnitarioTmp, setCostoUnitarioTmp] = useState(0);

  const [estaOptimizando, setEstaOptimizando] = useState(false);
  const [resultadosBusquedaNS, setResultadosBusquedaNS] = useState<any[]>([]);
  const [estaBuscandoNS, setEstaBuscandoNS] = useState(false);

  const esChefEditable = useMemo(() => role === 'CHEF' && (datosForm.estado === EstadoReceta.BORRADOR || datosForm.estado === EstadoReceta.APROBADO || datosForm.estado.includes('RECHAZADO')), [datosForm.estado, role]);
  const esCostosEditable = useMemo(() => role === 'COSTOS' && datosForm.estado === EstadoReceta.PENDIENTE_COSTOS, [datosForm.estado, role]);

  const manejarCambioNetSuite = (termino: string) => {
    setCodigoNetSuite(termino);
    // Ya no buscamos en tiempo real si tenemos cargados todos los insumos inicialmente
    // Pero mantenemos la función para el flujo de selección si es necesario
  };

  const seleccionarItemNetSuite = (termino: string) => {
    const terminoBusqueda = termino.toLowerCase();

    // Prioridad 1: Insumos (que ahora incluye los de NetSuite cargados al inicio)
    const ins = insumos.find(
      (i: any) =>
        (i.id && i.id.toLowerCase() === terminoBusqueda) ||
        (i.nombre && i.nombre.toLowerCase() === terminoBusqueda)
    );

    const sub = subRecipes.find(
      (r: any) => r.nombre && r.nombre.toLowerCase() === terminoBusqueda
    );

    if (ins) {
      setNombreInterno(ins.nombre);
      setIdReferenciaInterno(ins.id);
      setCodigoNetSuite(ins.id);
      setDescripcionDetalle(ins.nombre);
      setUnidadIngrediente(ins.unidadConsumo || 'unidad');

      let materialType = '';
      if (ins.id) {
        const prefijo = ins.id.toUpperCase();
        if (prefijo.startsWith('SE')) materialType = 'Semielaborado';
        else if (prefijo.startsWith('EM')) materialType = 'Empaque';
        else if (prefijo.startsWith('MP')) materialType = 'Materia Prima';
      }
      setTipoMaterialIngrediente(materialType);

      // Si tiene costo de DB, lo usamos
      if (ins.precioCompra) setCostoUnitarioTmp(ins.precioCompra);
    }
    else if (sub) {
      setNombreInterno(sub.nombre);
      setIdReferenciaInterno(sub.id);
      setDescripcionDetalle(sub.nombre);
      setUnidadIngrediente('unidad');

      let materialType = '';
      if (sub.id) {
        const prefijo = String(sub.id).toUpperCase();
        if (prefijo.startsWith('SE')) materialType = 'Semielaborado';
        else if (prefijo.startsWith('EM')) materialType = 'Empaque';
        else if (prefijo.startsWith('MP')) materialType = 'Materia Prima';
      }
      setTipoMaterialIngrediente(materialType);
    }
  };


  const agregarIngrediente = () => {
    if (!codigoNetSuite.trim() && !esProductoNuevo) return;

    let costoU = 0;
    let nombre = nombreInterno || codigoNetSuite;
    let tipo: 'INSUMO' | 'SUBRECETA' = 'INSUMO';
    let idReferencia = idReferenciaInterno;

    if (esProductoNuevo) {
      if (!codigo.trim() || !descripcionDetalle.trim()) {
        alert("Para crear un insumo nuevo debe proporcionar un Código (Código QC) y una Descripción.");
        return;
      }
      const nuevoId = codigo.trim();
      nombre = descripcionDetalle.trim();
      onSaveInsumo({
        id: nuevoId, nombre, estado: EstadoInsumo.PENDIENTE_COMPRAS,
        unidad: unidadIngrediente,
        unidadConsumo: unidadIngrediente,
        precioCompra: costoUnitarioTmp || 0,
        cantidadCompra: 1,
        factorConversion: 0,
        cantidadConvertida: 1,
        precioPorUnidad: costoUnitarioTmp || 0
      });
      idReferencia = nuevoId;
    } else {
      const ins = insumos.find((i: any) => i.id === idReferencia);
      const sub = subRecipes.find((r: any) => r.id === idReferencia);

      if (ins) {
        costoU = Number(ins.precioPorUnidad || ins.precioCompra || 0);
      } else if (sub) {
        tipo = 'SUBRECETA';
        costoU = sub.costoTotal;
      } else {
        return;
      }
    }

    const nuevoIng: IngredienteReceta = {
      id: Math.random().toString(36).substr(2, 9),
      tipo,
      idReferencia,
      nombre,
      cantidad: cantidadIngrediente,
      unidad: unidadIngrediente,
      costoUnitario: Number(costoUnitarioTmp || costoU || 0),
      costoTotal: Number(costoUnitarioTmp || costoU || 0) * Number(cantidadIngrediente || 0),
      codigo,
      codigoNetSuite,
      descripcionIngrediente: descripcionDetalle,
      marca,
      observaciones,
      tipoMaterial: tipoMaterialIngrediente
    };

    setDatosForm({ ...datosForm, ingredientes: [...datosForm.ingredientes, nuevoIng] });

    setCodigoNetSuite('');
    setEsProductoNuevo(false);
    setCodigo('');
    setDescripcionDetalle('');
    setMarca('');
    setObservaciones('');
    setNombreInterno('');
    setIdReferenciaInterno('');
    setCantidadIngrediente(1);
    setUnidadIngrediente('kg');
    setTipoMaterialIngrediente('');
    setCostoUnitarioTmp(0);
  };

  const tieneInsumosNuevos = useMemo(() => {
    return datosForm.ingredientes.some((ing: { idReferencia: any; }) => {
      const ins = insumos.find((i: any) => i.id === ing.idReferencia);
      const precio = Number(ins?.precioPorUnidad || ins?.precioCompra || 0);
      return ins && precio === 0;
    });
  }, [datosForm.ingredientes, insumos]);

  // Motor de Costeo en Tiempo Real (Proyectado)
  const costeoProyectado = useMemo(() => {
    let mp = 0;
    let emp = 0;
    let mudi = datosForm.mudi || 0;

    datosForm.ingredientes.forEach((ing: { tipo: string; idReferencia: any; cantidad: number; tipoMaterial: any; costoUnitario?: number; costoTotal?: number; }) => {
      if (ing.tipo === 'SUBRECETA') {
        const sub = subRecipes.find((r: any) => r.id === ing.idReferencia);
        if (sub) {
          mp += (sub.costoUnitarioMP || 0) * ing.cantidad;
          emp += (sub.costoUnitarioEMP || 0) * ing.cantidad;
          mudi += (sub.costoUnitarioMUDI || 0) * ing.cantidad;
        }
      } else {
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        if (ins) {
          const precioActualizado = Number(ins.precioPorUnidad || ins.precioCompra || 0);
          const costoUnitarioFinal = (ing.costoUnitario !== undefined && ing.costoUnitario !== null) ? Number(ing.costoUnitario) : precioActualizado;
          const costo = costoUnitarioFinal * (ing.cantidad || 0);
          const tipo = (ing.tipoMaterial || ins.tipoMaterial || '').toUpperCase();
          if (tipo.includes('EMPAQUE')) emp += costo;
          else if (tipo.includes('MODI')) mudi += costo;
          else mp += costo;
        }
      }
    });

    const base = mp + emp + mudi;
    const final = base + (datosForm.gif || 0);
    const divisor = datosForm.tipoCosteo === 'GRAMO' ? (datosForm.pesoTotalCantidad || 1) : (datosForm.porcionesCantidad || 1);

    return {
      totalMP: mp,
      totalEMP: emp,
      totalMUDI: mudi,
      costoTotalBase: base,
      costoTotalFinal: final,
      costoUnitarioMP: mp / divisor,
      costoUnitarioEMP: emp / divisor,
      costoUnitarioMUDI: mudi / divisor
    };
  }, [datosForm.ingredientes, datosForm.mudi, datosForm.gif, datosForm.tipoCosteo, datosForm.pesoTotalCantidad, datosForm.porcionesCantidad, insumos, subRecipes]);

  const ingredientesCategorizados = useMemo(() => {
    const grupos = {
      materiasPrimas: [] as IngredienteReceta[],
      empaque: [] as IngredienteReceta[],
      modi: [] as IngredienteReceta[]
    };

    datosForm.ingredientes.forEach((ing: IngredienteReceta) => {
      if (ing.tipo === 'SUBRECETA') {
        grupos.materiasPrimas.push(ing);
      } else {
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        const tipo = (ing.tipoMaterial || ins?.tipoMaterial || '').toUpperCase();
        if (tipo.includes('EMPAQUE')) {
          grupos.empaque.push(ing);
        } else if (tipo.includes('MODI')) {
          grupos.modi.push(ing);
        } else {
          grupos.materiasPrimas.push(ing);
        }
      }
    });

    return grupos;
  }, [datosForm.ingredientes, insumos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-full max-h-[92vh] border-0 overflow-hidden">

        {/* ENCABEZADO FIJO */}
        <div className="p-4 md:p-5 border-b bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{datosForm.nombre || 'Nueva Receta / Plato'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shadow-sm ${ESTILOS_ESTADO[datosForm.estado]}`}>
                  {ETIQUETAS_ESTADO[datosForm.estado]}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border px-2 py-0.5 rounded-md">
                  v{datosForm.versionActual}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b bg-white px-6 space-x-8 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { id: 'ficha', label: 'Receta' },
            { id: 'pasos', label: 'Preparación' },
            { id: 'historial', label: 'Versiones' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTabActiva(t.id as any)}
              className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${tabActiva === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300 hover:text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          {tabActiva === 'ficha' && (
            <div className="space-y-6 animate-in fade-in">
              {/* --- ENCABEZADO ADMINISTRATIVO --- */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Building2 className="w-2.5 h-2.5" /> Subsidiaria</label>
                  <input type="text" disabled className="w-full p-2 border rounded-lg font-black text-slate-500 bg-slate-100 outline-none text-[10px]" value={datosForm.subsidiaria} />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Elaborado por</label>
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-[10px]" value={datosForm.elaboradoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, elaboradoPor: e.target.value })} placeholder="Creador..." />
                  <datalist id="personal-datalist">
                    {PERSONAL_MOCK.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><BadgeCheck className="w-2.5 h-2.5" /> Aprobado por</label>
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-[10px]" value={datosForm.aprobadoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, aprobadoPor: e.target.value })} placeholder="Aprobación..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Warehouse className="w-2.5 h-2.5" /> Área que Produce</label>
                  <input list="areas-prod-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-[10px]" value={datosForm.areaProduce} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaProduce: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-prod-datalist">
                    {AREAS_PRODUCCION.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Package className="w-2.5 h-2.5" /> Área que Empaca</label>
                  <input list="areas-emp-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-[10px]" value={datosForm.areaEmpaca} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaEmpaca: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-emp-datalist">
                    {AREAS_EMPAQUE.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid  gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Nombre del Plato / Receta</label>
                      <input type="text" disabled={!esChefEditable} value={datosForm.nombre} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, nombre: e.target.value })}
                        className="w-full p-1.5 border rounded-xl font-black text-md outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm" />
                    </div>
                    {datosForm.codigoCalidad && (
                      <div className="relative">
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-1 tracking-widest flex items-center gap-1">Código QC <Lock className="w-2.5 h-2.5" /></label>
                        <div className="w-full p-2.5 border rounded-xl font-black text-lg bg-slate-100 text-slate-500 shadow-inner flex items-center justify-between">
                          {datosForm.codigoCalidad}
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="md:col-span-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 block mb-1 tracking-widest flex items-center gap-1">Flujo de Aprobación</label>
                      <select
                        disabled={!esChefEditable}
                        className="w-full p-1.5 border rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-sm text-slate-700"
                        value={datosForm.flujoAprobacionId || ''}
                        onChange={(e) => setDatosForm({ ...datosForm, flujoAprobacionId: e.target.value })}
                      >
                        {flujosAprobacion?.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.nombre}</option>
                        ))}
                        {(!flujosAprobacion || flujosAprobacion.length === 0) && (
                          <option value="">(Sin flujos disponibles)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-fit space-y-3">
                  <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Categorización</h4>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" disabled={!esChefEditable} checked={datosForm.esSemielaborado} onChange={(e: { target: { checked: any; }; }) => setDatosForm({ ...datosForm, esSemielaborado: e.target.checked, esSubReceta: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" id="semielaborado" />
                    <label htmlFor="semielaborado" className="cursor-pointer select-none">
                      <p className="font-black text-amber-900 uppercase text-[10px] tracking-tighter">Semielaborado</p>
                      <p className="text-[8px] text-slate-500 mt-0 font-bold uppercase tracking-tighter italic">En transformación</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><Calculator className="w-5 h-5 text-indigo-600" /> Matriz de Costeo Técnica</h3>

                {esChefEditable && (
                  <div className="space-y-3 p-4 bg-slate-900 rounded-2xl border shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Insumo / SubReceta</label>
                        <input
                          list="netsuite-datalist"
                          value={codigoNetSuite}
                          placeholder="Buscar por código Insumo o Nombre..."
                          className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs"
                          onChange={(e) => {
                            const value = e.target.value;
                            manejarCambioNetSuite(value);
                            seleccionarItemNetSuite(value);
                          }}
                        />
                        <datalist id="netsuite-datalist">
                          {insumos.map((i: any) => (
                            <option key={i.id} value={i.id}>{i.id} | {i.nombre}</option>
                          ))}
                          {subRecipes.map((r: any) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Código</label>
                        <input placeholder="Código Interno..." className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={codigo} onChange={(e: { target: { value: any; }; }) => setCodigo(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Marca</label>
                        <input placeholder="Marca" className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={marca} onChange={(e: { target: { value: any; }; }) => setMarca(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Descripción</label>
                        <input placeholder="Descripción..." className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={descripcionDetalle} onChange={(e: { target: { value: any; }; }) => setDescripcionDetalle(e.target.value)} />
                      </div>
                      {(!codigoNetSuite || esProductoNuevo) && (
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest flex items-center gap-1">Costo Unitario <span className="text-rose-500">*</span></label>
                          <input type="number" placeholder="0.00" className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={costoUnitarioTmp} onChange={(e) => setCostoUnitarioTmp(Number(e.target.value))} />
                        </div>
                      )}
                    </div>
                    {esProductoNuevo && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mt-2 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-[9px] font-bold text-rose-300">
                          Estás creando un Insumo Nuevo. Asegúrate de llenar <strong className="text-white">Código</strong> y <strong className="text-white">Descripción</strong>. Este insumo se guardará en el catálogo general.
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Observaciones</label>
                        <input placeholder="Notas..." className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={observaciones} onChange={(e: { target: { value: any; }; }) => setObservaciones(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Cant.</label>
                        <input type="number" value={cantidadIngrediente} onChange={(e: { target: { value: any; }; }) => setCantidadIngrediente(Number(e.target.value))} className="w-full p-2 border-none rounded-lg font-black text-indigo-300 bg-slate-800 text-xs" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">U.M.</label>
                        <select value={unidadIngrediente} onChange={(e: { target: { value: any; }; }) => setUnidadIngrediente(e.target.value)} className="w-full p-2 border-none rounded-lg bg-slate-800 font-bold text-white outline-none text-xs">{UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Tipo Material</label>
                        <input list="tipo-material-list" placeholder="Ej. Materia Prima, Empaque..." className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-xs" value={tipoMaterialIngrediente} onChange={(e: { target: { value: any; }; }) => setTipoMaterialIngrediente(e.target.value)} />
                        <datalist id="tipo-material-list">
                          <option value="Materia Prima" />
                          <option value="Semielaborado" />
                          <option value="Empaque" />
                          <option value="MODI" />
                        </datalist>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="es-nuevo-v4" className="w-3.5 h-3.5 rounded text-rose-500 accent-rose-500 cursor-pointer" checked={esProductoNuevo} onChange={(e: { target: { checked: any; }; }) => setEsProductoNuevo(e.target.checked)} />
                        <label htmlFor="es-nuevo-v4" className="text-[8px] font-black uppercase text-slate-400 cursor-pointer tracking-wider">Insumo Nuevo</label>
                      </div>
                      <button onClick={agregarIngrediente} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">AÑADIR LINEA</button>

                    </div>
                  </div>
                )}

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                      <tr className="border-b">
                        <th className="px-4 py-2">Insumo / Descripción</th>
                        <th className="px-4 py-2 text-center">Códigos</th>
                        <th className="px-4 py-2 text-center">Marca</th>
                        <th className="px-4 py-2 text-center">Cant / UM</th>
                        {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && <th className="px-4 py-2 text-right">Unitario</th>}
                        {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && <th className="px-4 py-2 text-right">Total</th>}
                        {esChefEditable && <th className="px-4 py-2 text-center">Acción</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {[
                        { label: 'Materias Primas & Semielaborados', data: ingredientesCategorizados.materiasPrimas },
                        { label: 'Empaque', data: ingredientesCategorizados.empaque },
                        { label: 'MODI', data: ingredientesCategorizados.modi }
                      ].map(seccion => seccion.data.length > 0 && (
                        <React.Fragment key={seccion.label}>

                          <tr className="bg-slate-50/50">
                            <td colSpan={esChefEditable ? 7 : 6} className="px-4 py-1.5 text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                              {seccion.label}
                            </td>
                          </tr>

                          {seccion.data.map((ing: {
                            id: any;
                            nombre: any;
                            descripcionIngrediente: any;
                            observaciones: any;
                            codigoICG: any;
                            codigoNetSuite: any;
                            marca: any;
                            cantidad: any;
                            unidad: any;
                            costoUnitario: number | null;
                            costoTotal: number | null;
                          }) => (
                            <tr key={ing.id ?? `${ing.nombre}-${Math.random()}`} className="hover:bg-slate-50 transition-colors align-top group">

                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-800 text-xs">{ing.nombre}</span>
                                  <span className="text-[9px] text-slate-400 italic mt-0.5">
                                    {ing.descripcionIngrediente || 'Sin detalle'}
                                  </span>
                                  <span className="text-[8px] text-indigo-500 font-bold mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                    {ing.observaciones || 'Sin obs.'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2 text-center">
                                <div className="flex flex-col gap-0.5 items-center">
                                  <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                                    Cód: {ing.codigoICG || '-'}
                                  </span>
                                  <span className="text-[8px] font-black bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 uppercase">
                                    ID/NS: {ing.codigoNetSuite || '-'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2 text-center font-bold text-slate-600 uppercase text-[9px]">
                                {ing.marca || '-'}
                              </td>

                              <td className="px-4 py-2 text-center font-black text-slate-900 text-xs">
                                {ing.cantidad} <span className="text-[8px] text-slate-400">{ing.unidad}</span>
                              </td>

                              {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                                <td className="px-4 py-2 text-right font-bold text-slate-400 text-xs">
                                  {(esCostosEditable || esChefEditable) ? (
                                    <input
                                      type="number"
                                      value={ing.costoUnitario !== undefined && ing.costoUnitario !== null ? ing.costoUnitario : ""}
                                      placeholder="0.00"
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDatosForm({
                                          ...datosForm,
                                          ingredientes: datosForm.ingredientes.map((i: any) =>
                                            i.id === ing.id ? { ...i, costoUnitario: val, costoTotal: val * (i.cantidad || 0) } : i
                                          )
                                        });
                                      }}
                                      className="w-24 p-1 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100"
                                      step="0.01"
                                      min="0"
                                    />
                                  ) : (
                                    (ing.costoUnitario ?? 0).toLocaleString('es-CR', {
                                      style: 'currency',
                                      currency: 'CRC'
                                    })
                                  )}
                                </td>
                              )}

                              {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                                <td className="px-4 py-2 text-right font-black text-slate-900 text-sm">
                                  {(ing.costoTotal ?? 0).toLocaleString('es-CR', {
                                    style: 'currency',
                                    currency: 'CRC'
                                  })}
                                </td>
                              )}

                              {esChefEditable && (
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() =>
                                      setDatosForm({
                                        ...datosForm,
                                        ingredientes: datosForm.ingredientes.filter((i: { id: any }) => i.id !== ing.id)
                                      })
                                    }
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}

                            </tr>
                          ))}

                          <tr className="bg-slate-50/20">
                            <td
                              colSpan={role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF' ? 5 : 4}
                              className="px-4 py-1.5 text-right text-[8px] font-bold text-slate-400 uppercase tracking-widest"
                            >
                              Subtotal {seccion.label}
                            </td>

                            {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                              <td className="px-4 py-1.5 text-right font-black text-indigo-400 text-xs">
                                {seccion.data
                                  .reduce((s: number, i: { costoTotal: number | null }) =>
                                    s + (i.costoTotal ?? 0),
                                    0
                                  )
                                  .toLocaleString('es-CR', {
                                    style: 'currency',
                                    currency: 'CRC'
                                  })}
                              </td>
                            )}

                            {esChefEditable && <td></td>}
                          </tr>

                        </React.Fragment>
                      ))}

                      <tr className="bg-slate-50 border-t-2 border-indigo-100">
                        <td
                          colSpan={role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF' ? 5 : 4}
                          className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]"
                        >
                          Costo Producción Bruto
                        </td>

                        {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                          <td className="px-4 py-4 text-right font-black text-indigo-600 text-lg tracking-tighter">
                            {datosForm.ingredientes
                              .reduce((s: number, i: { costoTotal: number | null }) =>
                                s + (i.costoTotal ?? 0),
                                0
                              )
                              .toLocaleString('es-CR', {
                                style: 'currency',
                                currency: 'CRC'
                              })}
                          </td>
                        )}

                        {esChefEditable && <td></td>}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md"><Dna className="w-4 h-4" /></div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Rendimiento y Producción</h4>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic opacity-75">Indicadores técnicos de salida</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Peso Total Obtenido */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Scale className="w-2.5 h-2.5" /> Peso Total</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.pesoTotalCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, pesoTotalCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.pesoTotalUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoTotalUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Merma */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-rose-500" /> Merma %</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.mermaCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, mermaCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.mermaUnidad || '%'} onChange={(e) => setDatosForm({ ...datosForm, mermaUnidad: e.target.value })}>
                          <option value="%">%</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </div>

                    {/* Cantidad de Porciones */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Layers className="w-2.5 h-2.5" /> Porciones</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.porcionesCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, porcionesCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.porcionesUnidad || 'porciones'} onChange={(e) => setDatosForm({ ...datosForm, porcionesUnidad: e.target.value })}>
                          <option value="porciones">porciones</option>
                          <option value="unidades">unidades</option>
                          <option value="platos">platos</option>
                        </select>
                      </div>
                    </div>

                    {/* Peso por Porción */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Scale className="w-2.5 h-2.5 text-indigo-400" /> Peso X Porción</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.pesoPorcionCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.pesoPorcionUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tiempo de Preparación */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> Tiempo Prep.</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.tiempoPrepCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, tiempoPrepCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.tiempoPrepUnidad || 'min'} onChange={(e) => setDatosForm({ ...datosForm, tiempoPrepUnidad: e.target.value })}>
                          {['min', 'horas'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tipo Costeo */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Coins className="w-2.5 h-2.5" /> Tipo Costeo</label>
                      <select disabled={!esChefEditable && !esCostosEditable} className="w-full p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.tipoCosteo || 'GRAMO'} onChange={(e) => setDatosForm({ ...datosForm, tipoCosteo: e.target.value as any })}>
                        <option value="GRAMO">Por Gramo</option>
                        <option value="UNIDAD">Por Unidad</option>
                      </select>
                    </div>

                    {/* MUDI */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><HandCoins className="w-2.5 h-2.5" /> MUDI</label>
                      <input type="number" disabled={!esCostosEditable && !esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.mudi || 0} onChange={(e) => setDatosForm({ ...datosForm, mudi: Number(e.target.value) })} />
                    </div>

                    {/* GIF (Solo visible para COSTOS/ADMIN) */}
                    {(role === 'COSTOS' || role === 'ADMIN') && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Factory className="w-2.5 h-2.5" /> GIF (Fijo)</label>
                        <input type="number" disabled={!esCostosEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-100 text-xs" value={datosForm.gif || 0} onChange={(e) => setDatosForm({ ...datosForm, gif: Number(e.target.value) })} />
                      </div>
                    )}
                  </div>

                  {/* Resultados de Costeo (Solo visibles para COSTOS) */}
                  {(role === 'COSTOS' || role === 'ADMIN') && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 border-dashed animate-in fade-in zoom-in duration-500">
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo MP ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-indigo-900">${(costeoProyectado.costoUnitarioMP || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo EMP ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-indigo-900">${(costeoProyectado.costoUnitarioEMP || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo MUDI ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-indigo-900">${(costeoProyectado.costoUnitarioMUDI || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Costo Total Final</p>
                        <p className="text-xl font-black text-indigo-600 leading-none">{(costeoProyectado.costoTotalFinal || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'pasos' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center bg-indigo-600 p-5 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                  <Sparkles className="w-8 h-8" />
                  <div><h4 className="text-lg font-black uppercase tracking-tight">IA Culinary Engine</h4><p className="text-xs opacity-80">Refina tus procesos con inteligencia artificial gastronómica.</p></div>
                </div>
                <button onClick={async () => {
                  setEstaOptimizando(true);
                  const opt = await optimizarPasosReceta(datosForm.nombre, datosForm.ingredientes.map((i: { nombre: any; }) => i.nombre));
                  if (opt) setDatosForm({ ...datosForm, pasos: opt });
                  setEstaOptimizando(false);
                }} disabled={estaOptimizando || !datosForm.nombre} className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md transition-all disabled:opacity-50">{estaOptimizando ? 'Procesando...' : 'Optimizar Pasos'}</button>
              </div>

              <div className="space-y-4">
                {esChefEditable && (
                  <div className="flex gap-4 p-4 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl items-center">
                    <textarea rows={2} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none font-medium text-sm resize-none focus:ring-2 focus:ring-indigo-100" placeholder="Describe el siguiente proceso técnico..." value={nuevoPaso} onChange={(e: { target: { value: any; }; }) => setNuevoPaso(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && nuevoPaso) { e.preventDefault(); setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} />
                    <button onClick={() => { if (nuevoPaso) { setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-sm">Añadir Paso</button>
                  </div>
                )}

                <div className="space-y-3">
                  {datosForm.pasos.map((p: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group transition-all hover:shadow-md">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{p}</p>
                      </div>
                      {esChefEditable && (
                        <button onClick={() => setDatosForm({ ...datosForm, pasos: datosForm.pasos.filter((_: any, idx: any) => idx !== i) })} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                  {datosForm.pasos.length === 0 && (
                    <div className="text-center py-6 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                      Aún no hay pasos en la preparación.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-500">
              <div className="p-10 bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-[3rem] text-center">
                <History className="w-16 h-16 text-indigo-300 mx-auto mb-6" />
                <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Trazabilidad Técnica de Cambios</h4>
                <p className="text-sm text-indigo-500 font-medium mt-2">Sello de inmutabilidad operativa y registro de certificaciones QC.</p>
              </div>

              <div className="space-y-6">
                {datosForm.versiones.slice().reverse().map((v: { numeroVersion: any; fechaAprobacion: any; aprobadoPorCostos: any; codigoCalidad: any; registroCambios: any; }, i: any) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-3xl">Certificado</div>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-indigo-100 transition-colors"><BadgeCheck className="w-8 h-8 text-indigo-600" /></div>
                      <div><h4 className="text-3xl font-black text-slate-900">Versión {v.numeroVersion}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditado el {v.fechaAprobacion}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">ID Auditor Costos</p>
                        <p className="font-bold text-slate-600">{v.aprobadoPorCostos || 'S/D'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Código QC de Control</p>
                        <p className="font-black text-indigo-600 text-lg">{v.codigoCalidad || 'S/D'}</p>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-slate-200">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Registro de Cambios</p>
                        <p className="text-sm font-medium text-slate-500 italic">"{v.registroCambios || 'Sin cambios registrados'}"</p>
                      </div>
                    </div>
                  </div>
                ))}
                {datosForm.versiones.length === 0 && (
                  <div className="py-20 text-center text-slate-200 font-black uppercase tracking-[0.4em] italic">No existen registros históricos para esta fórmula</div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 md:p-5 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${esCostosEditable ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full animate-pulse`}></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              GastroFlow Pro | Gestión {esCostosEditable ? 'de Costos' : 'Inmutable'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {esCostosEditable ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  Salir de Edición
                </button>
                <button
                  onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: EstadoReceta.PENDIENTE_COSTOS })}
                  className="flex-1 md:flex-none px-8 py-2.5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Guardar Avance de Costos
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm hover:bg-slate-50 transition-all">Cerrar</button>
                {esChefEditable && (
                  <>
                    <button onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: EstadoReceta.BORRADOR })} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm hover:bg-slate-200 transition-all">Borrador</button>
                    <button onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: EstadoReceta.PENDIENTE_COSTOS })} className="flex-1 md:flex-none px-8 py-2.5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">Enviar a Revisión</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
function ListaRecetas({ recipes, searchTerm, setSearchTerm, onEdit, onCreate, role }: any) {
  return (
    <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Administración de Versiones</h2>
          <p className="text-slate-500 font-medium text-[11px] mt-0.5">Control de versiones y trazabilidad de recetas.</p>
        </div>
        {role === 'CHEF' && (
          <button onClick={onCreate} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest">
            <Plus className="w-4 h-4" /> Nueva Receta
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar catálogo..."
              value={searchTerm}
              onChange={(e: { target: { value: any; }; }) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-100 outline-none font-medium text-xs transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto inner-scroll">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Nombre / Evolución</th>
                <th className="px-6 py-4">Fase Actual</th>
                <th className="px-6 py-4 text-right">Costo Auditado</th>
                <th className="px-6 py-4 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.slice().reverse().map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-2">
                    <div className="font-black text-slate-900 text-sm leading-tight">{r.nombre}</div>
                    <div className="text-[9px] text-slate-400 font-bold flex items-center gap-2">
                      <History className="w-2.5 h-2.5" /> v{r.versionActual}
                      <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 uppercase">ID: {r.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-md border shadow-sm ${ESTILOS_ESTADO[r.estado]}`}>
                      {ETIQUETAS_ESTADO[r.estado]}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-right">
                    <div className="font-black text-slate-900 text-sm leading-none">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Auditado: {r.fechaRevision}</div>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <button onClick={() => onEdit(r)} className="p-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function VistaAprobaciones({ pendingRecipes, role, onApprove, onReject, onOpen, onRefreshCosts }: any) {
  const [codigoCalidadInput, setCodigoCalidadInput] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-500">
      <header className="mb-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Centro de Aprobaciones</h2>
        <p className="text-slate-500 font-medium italic text-[10px]">Perfil activo: {role}</p>
      </header>

      <div className="grid gap-3">
        {pendingRecipes.map((r: any) => (
          <div
            key={r.id}
            className="bg-white p-4 rounded-2xl border flex flex-col lg:flex-row justify-between gap-4 shadow-sm relative group overflow-hidden"
          >
            {role === 'CALIDAD' && (
              <div className="absolute top-0 right-0 p-2 bg-violet-600 text-white font-black text-[7px] uppercase tracking-widest rounded-bl-lg">
                Certificación
              </div>
            )}

            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 bg-slate-50 rounded-xl border group-hover:bg-indigo-50 transition-colors">
                <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{r.nombre}</h3>
                  <button
                    onClick={() => onOpen(r)}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-slate-900 text-white rounded-full">
                    Costo: {r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                  </span>
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-indigo-50 text-indigo-700 border rounded-full">
                    Fase: {ETIQUETAS_ESTADO[r.estado]}
                  </span>
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-slate-50 text-slate-400 border rounded-full">
                    v{r.versionActual}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 min-w-[280px] lg:border-l lg:pl-6 border-slate-100">
              {role === 'COSTOS' && r.estado === EstadoReceta.PENDIENTE_COSTOS && (
                <button
                  onClick={() => onRefreshCosts(r.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase shadow-md hover:bg-amber-600 active:scale-95 transition-all border border-amber-600 group"
                >
                  <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  Refrescar Costos
                </button>
              )}

              {role === 'CALIDAD' && (
                <div className="space-y-2">
                  {r.codigoCalidad ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                          Certificación Vigente <ShieldCheck className="w-2.5 h-2.5" />
                        </p>
                        <p className="font-black text-emerald-800 text-lg tracking-tight leading-none mt-0.5">
                          {r.codigoCalidad}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        QC Pass Certification
                      </label>
                      <input
                        type="text"
                        placeholder="ID de certificación..."
                        value={codigoCalidadInput[r.id] || ''}
                        onChange={(e) => setCodigoCalidadInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="w-full p-3 border rounded-xl text-xs font-black focus:border-indigo-600 outline-none bg-slate-50"
                      />
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 mt-auto">
                {role === 'CALIDAD' ? (
                  <button
                    onClick={() => {
                      const codigoFinal = codigoCalidadInput[r.id]?.trim() || r.codigoCalidad;
                      if (!codigoFinal) {
                        alert("Por favor ingrese el código QC físico / químico para certificar la receta.");
                        return;
                      }
                      onApprove(r.id, role, codigoFinal);
                      setCodigoCalidadInput(prev => { const next = { ...prev }; delete next[r.id]; return next; });
                    }}
                    disabled={!r.codigoCalidad && !codigoCalidadInput[r.id]?.trim()}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-700 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-2 group border border-emerald-500"
                  >
                    <Save className="w-4 h-4" /> Certificar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(r.id, role)}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      <BadgeCheck className="w-4 h-4" /> Aprobar Revisión
                    </button>
                    <button
                      onClick={() => onReject(r.id, role)}
                      className="flex-1 bg-white border border-rose-100 text-rose-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {pendingRecipes.length === 0 && (
          <div className="text-center p-20 bg-white border-2 border-dashed rounded-[3rem] text-slate-300 font-black uppercase tracking-widest">
            <BadgeCheck className="w-16 h-16 mx-auto mb-4 opacity-5" />
            0 Pendientes
          </div>
        )}
      </div>
    </div>
  );
}
