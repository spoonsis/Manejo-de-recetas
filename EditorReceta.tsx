import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Camera, Plus, Trash2, Search, Sparkles, History, Scale, TrendingUp, Layers, Timer, Coins, HandCoins, Factory, BadgeCheck, Eye, ShieldCheck, FileText, Dna, BookOpen, Loader2, AlertCircle, Trash, Building2, Users, Warehouse, Package, Lock, Calculator, GripVertical, ChevronUp, ChevronDown, Pencil, Check
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExportarRecetaPDF from './ExportarRecetaPDF';
import { Receta, EstadoReceta, EstadoInsumo, Rol, IngredienteReceta } from './types';
import { ESTILOS_ESTADO, ETIQUETAS_ESTADO, UNIDADES } from './constants';
import { optimizarPasosReceta } from './geminiService';
import { useStore } from './useStore';

// --- Listas de Referencia ---
// Ahora se reciben como prop 'areas'

export default function EditorReceta({ recipe, insumos, subRecipes, flujosAprobacion, onClose, onSave, onSaveInsumo, role, areas = [], onViewRecipe, obtenerEtiquetaEstado }: any) {
  const [datosForm, setDatosForm] = useState<Receta>(() => {
    const calculatedFlujo = recipe.esSemielaborado ? 'f_semielaborado' : (recipe.flujoAprobacionId || 'f1');
    return {
      ...recipe,
      flujoAprobacionId: calculatedFlujo
    };
  });
  const [tabActiva, setTabActiva] = useState<'ficha' | 'pasos' | 'historial' | 'costeo'>('ficha');
  const [nuevoPaso, setNuevoPaso] = useState('');
  const [nombreTmp, setNombreTmp] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState<number | undefined>(0);
  const [unidadIngrediente, setUnidadIngrediente] = useState('g');
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
  const [seccionRecetaTmp, setSeccionRecetaTmp] = useState<'ENSAMBLE' | 'DECORACION' | 'EMPAQUE'>('ENSAMBLE');
  const [costoUnitarioTmp, setCostoUnitarioTmp] = useState(0);

  const [estaOptimizando, setEstaOptimizando] = useState(false);
  const [resultadosBusquedaNS, setResultadosBusquedaNS] = useState<any[]>([]);
  const [estaBuscandoNS, setEstaBuscandoNS] = useState(false);

  const esChefEditable = useMemo(() => role === 'CHEF' && (datosForm.estado === EstadoReceta.BORRADOR || datosForm.estado === EstadoReceta.APROBADO || datosForm.estado.includes('RECHAZADO')), [datosForm.estado, role]);
  const esCostosEditable = useMemo(() => role === 'COSTOS' && datosForm.estado === EstadoReceta.PENDIENTE_COSTOS, [datosForm.estado, role]);

  // --- Reordenar Pasos de Preparación ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (!esChefEditable) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPasos = [...datosForm.pasos];
    const draggedItem = newPasos[draggedIndex];
    newPasos.splice(draggedIndex, 1);
    newPasos.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setDatosForm({ ...datosForm, pasos: newPasos });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const subirPaso = (index: number) => {
    if (index === 0) return;
    const newPasos = [...datosForm.pasos];
    const temp = newPasos[index];
    newPasos[index] = newPasos[index - 1];
    newPasos[index - 1] = temp;
    setDatosForm({ ...datosForm, pasos: newPasos });
  };

  const bajarPaso = (index: number) => {
    if (index === datosForm.pasos.length - 1) return;
    const newPasos = [...datosForm.pasos];
    const temp = newPasos[index];
    newPasos[index] = newPasos[index + 1];
    newPasos[index + 1] = temp;
    setDatosForm({ ...datosForm, pasos: newPasos });
  };

  // --- Editar Pasos de Preparación ---
  const [editingPasoIndex, setEditingPasoIndex] = useState<number | null>(null);
  const [editingPasoText, setEditingPasoText] = useState('');

  const iniciarEdicionPaso = (index: number, text: string) => {
    if (!esChefEditable) return;
    setEditingPasoIndex(index);
    setEditingPasoText(text);
  };

  const guardarEdicionPaso = (index: number) => {
    if (!editingPasoText.trim()) return;
    const newPasos = [...datosForm.pasos];
    newPasos[index] = editingPasoText;
    setDatosForm({ ...datosForm, pasos: newPasos });
    setEditingPasoIndex(null);
    setEditingPasoText('');
  };

  const cancelarEdicionPaso = () => {
    setEditingPasoIndex(null);
    setEditingPasoText('');
  };



  // Obtener el estado del primer paso del flujo asignado
  const estadoInicial = useMemo(() => {
    const flujoAsignado = flujosAprobacion?.find((f: any) => f.id === datosForm.flujoAprobacionId) || 
                          flujosAprobacion?.find((f: any) => f.activo) || 
                          flujosAprobacion?.[0];
    if (!flujoAsignado || !flujoAsignado.pasos || flujoAsignado.pasos.length === 0) {
      return EstadoReceta.PENDIENTE_COSTOS;
    }
    const pasosOrdenados = [...flujoAsignado.pasos].sort((a: any, b: any) => a.orden - b.orden);
    const primerPaso = pasosOrdenados[0];
    if (primerPaso.rolResponsable === 'MKT') return EstadoReceta.PENDIENTE_MKT;
    if (primerPaso.rolResponsable === 'CALIDAD') return EstadoReceta.PENDIENTE_CALIDAD;
    return EstadoReceta.PENDIENTE_COSTOS;
  }, [flujosAprobacion, datosForm.flujoAprobacionId]);

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
      setUnidadIngrediente('g');

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
      setUnidadIngrediente('g');

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
    let tipo: 'INSUMO' | 'SEMIELABORADO' = 'INSUMO';
    let idReferencia = idReferenciaInterno;

    if (esProductoNuevo) {
      if (!descripcionDetalle.trim()) {
        alert("Para crear un insumo nuevo debe proporcionar una Descripción.");
        return;
      }
      const nuevoId = `NVO-${Math.floor(Date.now() / 1000)}`;
      nombre = descripcionDetalle.trim();
      onSaveInsumo({
        id: nuevoId, nombre, estado: EstadoInsumo.PENDIENTE_COMPRAS,
        unidad: unidadIngrediente,
        unidadConsumo: unidadIngrediente,
        precioCompra: costoUnitarioTmp || 0,
        cantidadCompra: 1,
        factorConversion: 0,
        cantidadConvertida: 1,
        precioPorUnidad: costoUnitarioTmp || 0,
        marca: marca,
        tipoMaterial: tipoMaterialIngrediente
      });
      idReferencia = nuevoId;
    } else {
      const ins = insumos.find((i: any) => i.id === idReferencia);
      const sub = subRecipes.find((r: any) => r.id === idReferencia);

      if (ins) {
        costoU = Number(ins.precioPorUnidad || ins.precioCompra || 0);
      } else if (sub) {
        tipo = 'SEMIELABORADO';
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
      tipoMaterial: tipoMaterialIngrediente,
      seccionReceta: seccionRecetaTmp
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
    setCantidadIngrediente(0);
    setUnidadIngrediente('g');
    setTipoMaterialIngrediente('');
    setSeccionRecetaTmp('ENSAMBLE');
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
    let mudi_se = 0;
    let gif_se = 0;
    let tieneSEBruto = false;

    datosForm.ingredientes.forEach((ing: { tipo: string; idReferencia: any; cantidad: number; tipoMaterial: any; costoUnitario?: number; costoTotal?: number; costoEstructuralMP?: number; costoEstructuralEMP?: number; costoEstructuralMODI?: number; }) => {
      if (ing.tipo === 'SEMIELABORADO') {
        const sub = subRecipes.find((r: any) => r.id === ing.idReferencia);
        if (sub) {
          const divisorSub = sub.tipoCosteo === 'GRAMO' ? (sub.pesoTotalCantidad || 1) : (sub.porcionesCantidad || 1);
          const costoUnitarioGIFSub = (sub.gif || 0) / divisorSub;

          mp += (ing.costoEstructuralMP !== undefined ? ing.costoEstructuralMP : (sub.costoUnitarioMP || 0)) * ing.cantidad;
          emp += (ing.costoEstructuralEMP !== undefined ? ing.costoEstructuralEMP : (sub.costoUnitarioEMP || 0)) * ing.cantidad;
          mudi_se += (ing.costoEstructuralMODI !== undefined ? ing.costoEstructuralMODI : (sub.costoUnitarioMUDI || 0)) * ing.cantidad;
          gif_se += costoUnitarioGIFSub * ing.cantidad;
        } else {
          // Si no existe subreceta pero el usuario digitó los valores
          mp += (ing.costoEstructuralMP || 0) * ing.cantidad;
          emp += (ing.costoEstructuralEMP || 0) * ing.cantidad;
          mudi_se += (ing.costoEstructuralMODI || 0) * ing.cantidad;
        }
      } else {
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        if (ins) {
          const precioActualizado = Number(ins.precioPorUnidad || ins.precioCompra || 0);
          const costoUnitarioFinal = (ing.costoUnitario !== undefined && ing.costoUnitario !== null) ? Number(ing.costoUnitario) : precioActualizado;
          const costo = costoUnitarioFinal * (ing.cantidad || 0);

          if (String(ins.id).toUpperCase().startsWith('SE') || (ing.tipoMaterial || ins.tipoMaterial || '').toUpperCase() === 'SEMIELABORADO') {
            // Es un Semielaborado que viene desde NetSuite
            const tieneDesgloseNetSuite = ins.costoEstructuralMP !== undefined || ins.costoEstructuralEMP !== undefined || ins.costoEstructuralMODI !== undefined;
            const tieneDesgloseManual = ing.costoEstructuralMP !== undefined || ing.costoEstructuralEMP !== undefined || ing.costoEstructuralMODI !== undefined;

            if (tieneDesgloseManual) {
               mp += Number(ing.costoEstructuralMP || 0) * ing.cantidad;
               emp += Number(ing.costoEstructuralEMP || 0) * ing.cantidad;
               mudi_se += Number(ing.costoEstructuralMODI || 0) * ing.cantidad;
               gif_se += Number(ins.costoEstructuralGIF || 0) * ing.cantidad;
            } else if (tieneDesgloseNetSuite) {
               mp += Number(ins.costoEstructuralMP || 0) * ing.cantidad;
               emp += Number(ins.costoEstructuralEMP || 0) * ing.cantidad;
               mudi_se += Number(ins.costoEstructuralMODI || 0) * ing.cantidad;
               gif_se += Number(ins.costoEstructuralGIF || 0) * ing.cantidad;
            } else {
               // Fallback: al no haber desglose, encapsulamos el total completo temporalmente en MP
               mp += costo; 
               tieneSEBruto = true;
            }
          } else {
             const tipo = (ing.tipoMaterial || ins.tipoMaterial || '').toUpperCase();
             if (tipo.includes('EMPAQUE')) emp += costo;
             else if (tipo.includes('MODI')) mudi_se += costo;
             else mp += costo;
          }
        }
      }
    });

    const tiempoProceso = Number(datosForm.tiempoProcesoMinutos || 0);
    const tasaMUDI = Number(datosForm.tasaMUDI || 77);
    const tasaGIF = Number(datosForm.tasaGIF || 83);

    // Calcular el % de desecho real en base a peso total y merma
    const pesoTotal = Number(datosForm.pesoTotalCantidad || 0);
    const merma = Number(datosForm.mermaCantidad || 0);
    const totalInsumos = pesoTotal + merma;
    const porcentajeDesecho = totalInsumos > 0 ? (merma / totalInsumos) * 100 : 0;

    const mudi_propio = tiempoProceso * tasaMUDI;
    const gif_propio = tiempoProceso * tasaGIF;
    
    // Desecho sobre acumulado de MP (incluyendo MP de Semielaborados porque ya está acumulado en "mp")
    const costoDesecho = mp * (porcentajeDesecho / 100);

    const mudi_total = mudi_se + mudi_propio;
    const gif_total = tasaMUDI > 0 ? (mudi_total / tasaMUDI) * tasaGIF : 0;

    const base = mp + emp + mudi_total + costoDesecho;
    const final = base + gif_total;
    const divisor = datosForm.tipoCosteo === 'GRAMO' ? (datosForm.pesoTotalCantidad || 1) : (datosForm.porcionesCantidad || 1);

    return {
      totalMP: mp,
      totalEMP: emp,
      totalMUDI: mudi_total,
      gif: gif_total,
      tiempoProcesoMinutos: tiempoProceso,
      costoDesecho: costoDesecho,
      porcentajeDesecho: porcentajeDesecho,
      costoTotalBase: base,
      costoTotalFinal: final,
      costoUnitarioMP: mp / divisor,
      costoUnitarioEMP: emp / divisor,
      costoUnitarioMUDI: mudi_total / divisor,
      tieneSEBruto
    };
  }, [
    datosForm.ingredientes, 
    datosForm.tiempoProcesoMinutos, 
    datosForm.tasaMUDI, 
    datosForm.tasaGIF, 
    datosForm.mermaCantidad, 
    datosForm.tipoCosteo, 
    datosForm.pesoTotalCantidad, 
    datosForm.porcionesCantidad, 
    insumos, 
    subRecipes
  ]);

  // Cálculo automático de Suma de Insumos y Merma basado en ingredientes
  const depIng = JSON.stringify(datosForm.ingredientes.map((i: any) => ({ id: i.idReferencia, qty: i.cantidad })));
  useEffect(() => {
    let sum = 0;
    datosForm.ingredientes.forEach((ing: any) => {
      if (ing.tipo === 'SEMIELABORADO') {
        sum += (ing.cantidad || 0);
      } else {
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        if (ins) {
          const tipo = (ing.tipoMaterial || ins.tipoMaterial || '').toUpperCase();
          if (!tipo.includes('EMPAQUE') && !tipo.includes('MODI')) {
            sum += (ing.cantidad || 0);
          }
        } else {
          sum += (ing.cantidad || 0);
        }
      }
    });

    if (sum !== datosForm.sumaTotalInsumos) {
      setDatosForm((prev: any) => ({
        ...prev,
        sumaTotalInsumos: sum,
        mermaCantidad: sum - (prev.pesoTotalCantidad || 0),
        mermaUnidad: 'g' // Fija la magnitud en gramos
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depIng]);

  const ingredientesCategorizados = useMemo(() => {
    const grupos = {
      ensamble: [] as IngredienteReceta[],
      decoracion: [] as IngredienteReceta[],
      empaque: [] as IngredienteReceta[]
    };

    datosForm.ingredientes.forEach((ing: IngredienteReceta) => {
      // Prioridad 1: Campo explícito 'seccionReceta'
      if (ing.seccionReceta === 'ENSAMBLE') {
        grupos.ensamble.push(ing);
      } else if (ing.seccionReceta === 'DECORACION') {
        grupos.decoracion.push(ing);
      } else if (ing.seccionReceta === 'EMPAQUE') {
        grupos.empaque.push(ing);
      } else {
        // Fallback para datos antiguos o legacy basados en tipoMaterial
        const ins = insumos.find((i: any) => i.id === ing.idReferencia);
        const tipo = (ing.tipoMaterial || ins?.tipoMaterial || '').toUpperCase();

        if (tipo.includes('EMPAQUE')) {
          grupos.empaque.push(ing);
        } else {
          // Todo lo demás cae en ensamble si no tiene sección definida
          grupos.ensamble.push(ing);
        }
      }
    });

    return grupos;
  }, [datosForm.ingredientes, insumos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-full max-h-[92vh] border-0 overflow-hidden">

        {/* ENCABEZADO FIJO */}
        <div className="py-2 px-4 md:px-5 border-b bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                {datosForm.detalle_nombre_receta || datosForm.nombre || 'Nueva Receta / Plato'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shadow-sm ${ESTILOS_ESTADO[datosForm.estado]}`}>
                  {obtenerEtiquetaEstado ? obtenerEtiquetaEstado(datosForm) : ETIQUETAS_ESTADO[datosForm.estado]}
                </span>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 border px-1.5 py-0.5 rounded-md">
                  v{datosForm.versionActual}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-4.5 h-4.5 text-slate-600" />
          </button>
        </div>

        <div className="flex border-b bg-white px-6 space-x-8 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { id: 'ficha', label: 'Receta' },
            { id: 'pasos', label: 'Preparación' },
            { id: 'historial', label: 'Versiones' },
            ...(role === 'COSTOS' || role === 'ADMIN' ? [{ id: 'costeo', label: 'Reporte Costos' }] : [])
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTabActiva(t.id as any)}
              className={`py-3 text-sm font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${tabActiva === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-700 hover:text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          {tabActiva === 'ficha' && (
            <div className="space-y-6 animate-in fade-in">
              {/* --- ENCABEZADO ADMINISTRATIVO --- */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl shadow-sm">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1"><Building2 className="w-2.5 h-2.5" /> Subsidiaria</label>
                  <input type="text" disabled className="w-full p-1.5 border rounded-lg font-bold text-slate-700 bg-slate-100 outline-none text-xs" value={datosForm.subsidiaria} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Elaborado por</label>
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.elaboradoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, elaboradoPor: e.target.value })} placeholder="Creador..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1"><BadgeCheck className="w-2.5 h-2.5" /> Aprobado por</label>
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.aprobadoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, aprobadoPor: e.target.value })} placeholder="Aprobación..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1"><Warehouse className="w-2.5 h-2.5" /> Área que Produce</label>
                  <input list="areas-prod-datalist" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.areaProduce} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaProduce: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-prod-datalist">
                    {areas.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1"><Package className="w-2.5 h-2.5" /> Área que Empaca</label>
                  <input list="areas-emp-datalist" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.areaEmpaca} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaEmpaca: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-emp-datalist">
                    {areas.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block">Nombre del Plato / Receta</label>
                  <input type="text" disabled={!esChefEditable} value={datosForm.nombre} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, nombre: e.target.value })}
                    className="w-full p-1.5 border rounded-lg font-bold text-xs bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm transition-all" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block">Código NetSuite de la Receta</label>
                  <input
                    type="text"
                    disabled={!esChefEditable}
                    value={datosForm.codigo_netsuite || ''}
                    onChange={(e) => setDatosForm({ ...datosForm, codigo_netsuite: e.target.value })}
                    placeholder="Ej. 95822"
                    className="w-full p-1.5 border rounded-lg font-bold text-xs bg-slate-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm transition-all"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block">Categorización</label>
                  <div className="w-full bg-slate-50/50 border border-slate-100 rounded-lg p-1.5 flex items-center gap-2 h-[34px]">
                    <input 
                      type="checkbox" 
                      disabled={!esChefEditable} 
                      checked={datosForm.esSemielaborado} 
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDatosForm({ 
                          ...datosForm, 
                          esSemielaborado: checked,
                          flujoAprobacionId: checked ? 'f_semielaborado' : 'f1'
                        });
                      }} 
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" 
                      id="semielaborado" 
                    />
                    <label htmlFor="semielaborado" className="cursor-pointer select-none leading-none">
                      <span className="font-black text-amber-900 uppercase text-[9px] tracking-tight block">Semielaborado</span>
                      <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-tight italic block">En transformación</span>
                    </label>
                  </div>
                </div>

                {datosForm.detalle_nombre_receta && datosForm.codigoCalidad && (
                  <>
                    <div className="md:col-span-5 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Nombre Detallado Final (Auto) <BadgeCheck className="w-2 h-2 text-emerald-500" /></label>
                      <div className="w-full p-1.5 border border-emerald-100 rounded-lg font-bold text-[10px] bg-emerald-50/50 text-emerald-950 shadow-inner h-[34px] flex items-center">
                        {datosForm.detalle_nombre_receta}
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Código QC <Lock className="w-2 h-2" /></label>
                      <div className="w-full p-1.5 border rounded-lg font-bold text-xs bg-slate-100 text-slate-700 shadow-inner flex items-center justify-between h-[34px]">
                        {datosForm.codigoCalidad}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Flujo de Aprobación</label>
                      <select
                        disabled={true}
                        className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm text-xs text-slate-700 transition-all h-[34px]"
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
                  </>
                )}

                {datosForm.detalle_nombre_receta && !datosForm.codigoCalidad && (
                  <>
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Nombre Detallado Final (Auto) <BadgeCheck className="w-2 h-2 text-emerald-500" /></label>
                      <div className="w-full p-1.5 border border-emerald-100 rounded-lg font-bold text-[10px] bg-emerald-50/50 text-emerald-950 shadow-inner h-[34px] flex items-center">
                        {datosForm.detalle_nombre_receta}
                      </div>
                    </div>
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Flujo de Aprobación</label>
                      <select
                        disabled={true}
                        className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm text-xs text-slate-700 transition-all h-[34px]"
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
                  </>
                )}

                {!datosForm.detalle_nombre_receta && datosForm.codigoCalidad && (
                  <>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Código QC <Lock className="w-2 h-2" /></label>
                      <div className="w-full p-1.5 border rounded-lg font-bold text-xs bg-slate-100 text-slate-700 shadow-inner flex items-center justify-between h-[34px]">
                        {datosForm.codigoCalidad}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Flujo de Aprobación</label>
                      <select
                        disabled={true}
                        className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm text-xs text-slate-700 transition-all h-[34px]"
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
                  </>
                )}

                {!datosForm.detalle_nombre_receta && !datosForm.codigoCalidad && (
                  <div className="md:col-span-12 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wide block flex items-center gap-1">Flujo de Aprobación</label>
                    <select
                      disabled={true}
                      className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm text-xs text-slate-700 transition-all h-[34px]"
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
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-600" /> Matriz de Costeo Técnica</h3>

                {esChefEditable && (
                  <div className="space-y-3 p-3 bg-slate-900 rounded-xl border shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      <div className="md:col-span-1">
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Insumo / SubReceta</label>
                        <input
                          list="netsuite-datalist"
                          value={codigoNetSuite}
                          placeholder="Buscar por código Insumo o Nombre..."
                          className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]"
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
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Tipo Insumo</label>
                        <input
                          disabled
                          className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-emerald-400 text-[10px] text-center uppercase tracking-widest cursor-not-allowed"
                          value={esProductoNuevo ? 'Nuevo' : (codigoNetSuite ? 'Existente' : '-')}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Marca</label>
                        <input placeholder="Marca" className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]" value={marca} onChange={(e: { target: { value: any; }; }) => setMarca(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Descripción</label>
                        <input placeholder="Descripción..." className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]" value={descripcionDetalle} onChange={(e: { target: { value: any; }; }) => setDescripcionDetalle(e.target.value)} />
                      </div>
                      {(!codigoNetSuite || esProductoNuevo) && (
                        <div>
                          <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest flex items-center gap-1">Costo Unitario <span className="text-rose-500">*</span></label>
                          <input type="number" placeholder="0.00" className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]" value={costoUnitarioTmp} onChange={(e) => setCostoUnitarioTmp(Number(e.target.value))} />
                        </div>
                      )}
                    </div>
                    {esProductoNuevo && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mt-1 mb-1 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-bold text-rose-300">
                          Estás creando un Insumo Nuevo. Asegúrate de proporcionar una <strong className="text-white">Descripción</strong> clara. Este insumo se guardará posteriormente en tu catálogo al guardar.
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5">
                      <div className="md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Observaciones</label>
                        <input placeholder="Notas..." className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]" value={observaciones} onChange={(e: { target: { value: any; }; }) => setObservaciones(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Cant.</label>
                        <input type="number" value={cantidadIngrediente} onChange={(e: { target: { value: any; }; }) => setCantidadIngrediente(Number(e.target.value))} className="w-full p-1.5 border-none rounded-lg font-black text-emerald-300 bg-slate-800 text-[10px]" />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">U.M.</label>
                        <select value={unidadIngrediente} onChange={(e: { target: { value: any; }; }) => setUnidadIngrediente(e.target.value)} className="w-full p-1.5 border-none rounded-lg bg-slate-800 font-bold text-white outline-none text-[10px]">{UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Tipo Material</label>
                        <input list="tipo-material-list" placeholder="Ej. Materia Prima..." className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px]" value={tipoMaterialIngrediente} onChange={(e: { target: { value: any; }; }) => setTipoMaterialIngrediente(e.target.value)} />
                        <datalist id="tipo-material-list">
                          <option value="Materia Prima" />
                          <option value="Semielaborado" />
                          <option value="Empaque" />
                          <option value="MODI" />
                        </datalist>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs font-black uppercase text-amber-500 block mb-0.5 tracking-widest">Sección Receta</label>
                        <select
                          className="w-full p-1.5 border-none rounded-lg font-bold outline-none bg-slate-800 text-white text-[10px] uppercase"
                          value={seccionRecetaTmp}
                          onChange={(e) => setSeccionRecetaTmp(e.target.value as any)}
                        >
                          <option value="ENSAMBLE">Ensamble</option>
                          <option value="DECORACION">Decoración</option>
                          <option value="EMPAQUE">Empaque</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <input type="checkbox" id="es-nuevo-v4" className="w-3 h-3 rounded text-rose-500 accent-rose-500 cursor-pointer" checked={esProductoNuevo} onChange={(e: { target: { checked: any; }; }) => setEsProductoNuevo(e.target.checked)} />
                        <label htmlFor="es-nuevo-v4" className="text-xs font-black uppercase text-slate-400 cursor-pointer tracking-wider">Insumo Nuevo</label>
                      </div>
                      <button onClick={agregarIngrediente} className="bg-emerald-600 text-white px-5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">AÑADIR LINEA</button>

                    </div>
                  </div>
                )}

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-widest text-[10px]">
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
                        { label: 'Ensamble', data: ingredientesCategorizados.ensamble, color: 'text-emerald-600' },
                        { label: 'Decoración', data: ingredientesCategorizados.decoracion, color: 'text-amber-600' },
                        { label: 'Empaque', data: ingredientesCategorizados.empaque, color: 'text-blue-600' }
                      ].map(seccion => seccion.data.length > 0 && (
                        <React.Fragment key={seccion.label}>

                          <tr className="bg-slate-50/50">
                            <td colSpan={esChefEditable ? 7 : 6} className={`px-4 py-1.5 text-sm font-black ${seccion.color} uppercase tracking-widest`}>
                              {seccion.label}
                            </td>
                          </tr>

                          {seccion.data.map((ing: any) => (
                            <tr key={ing.id ?? `${ing.nombre}-${Math.random()}`} className="hover:bg-slate-50 transition-colors align-top group">

                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-800 text-xs">
                                    {ing.tipo === 'SEMIELABORADO' ? (
                                      <button 
                                        className="text-emerald-700 hover:text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer text-left text-xs font-black transition-colors" 
                                        onClick={(e) => { 
                                          e.preventDefault(); 
                                          if (onViewRecipe) {
                                            onViewRecipe(ing.idReferencia);
                                          } else {
                                            alert(`Trazabilidad: La receta origen de ${ing.nombre} se puede abrir desde el libro de recetas.`);
                                          }
                                        }}
                                        title="Abrir receta origen"
                                      >
                                        <Layers className="w-3.5 h-3.5" /> {ing.nombre}
                                      </button>
                                    ) : (
                                      ing.nombre
                                    )}
                                  </span>
                                  <span className="text-xs text-slate-600 italic mt-0.5">
                                    {ing.descripcionIngrediente || 'Sin detalle'}
                                  </span>
                                  <span className="text-sm text-emerald-500 font-bold mt-0.5 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                                    {ing.observaciones || 'Sin obs.'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2 text-center">
                                <div className="flex flex-col gap-0.5 items-center">
                                  <span className="text-sm font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                                    Cód: {ing.codigoICG || '-'}
                                  </span>
                                  <span className="text-sm font-black bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 uppercase">
                                    ID/NS: {ing.codigoNetSuite || '-'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2 text-center font-bold text-slate-600 uppercase text-xs">
                                {ing.marca || '-'}
                              </td>

                              <td className="px-4 py-2 text-center font-black text-slate-900 text-xs">
                                <div className="flex justify-center items-center gap-1">
                                  {esChefEditable ? (
                                    <input
                                      type="number"
                                      value={ing.cantidad}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDatosForm({
                                          ...datosForm,
                                          ingredientes: datosForm.ingredientes.map((i: any) =>
                                            (i.id === ing.id || (i.nombre === ing.nombre && i.id === undefined)) ? { ...i, cantidad: val, costoTotal: (i.costoUnitario || 0) * val } : i
                                          )
                                        });
                                      }}
                                      className="w-20 p-1 border rounded bg-white text-center font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100"
                                      step="0.001"
                                      min="0"
                                    />
                                  ) : (
                                    ing.cantidad
                                  )}
                                  <span className="text-sm text-slate-600">{ing.unidad}</span>
                                </div>
                              </td>

                              {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                                <td className="px-4 py-2 text-right font-bold text-slate-600 text-xs">
                                  {(esCostosEditable || esChefEditable) ? (
                                    ((ing.tipo === 'SEMIELABORADO' || (ing.codigoNetSuite || '').toUpperCase().startsWith('SE') || (ing.tipoMaterial || '').toUpperCase() === 'SEMIELABORADO') && role === 'COSTOS') ? (
                                      <div className="flex flex-col gap-1 w-32 ml-auto">
                                        <div className="flex justify-between items-center text-sm gap-1">
                                          <span className="text-slate-600">MP:</span>
                                          <input type="number" disabled={!esCostosEditable} placeholder="0.00" value={ing.costoEstructuralMP !== undefined ? ing.costoEstructuralMP : ""} onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setDatosForm({
                                              ...datosForm,
                                              ingredientes: datosForm.ingredientes.map((i: any) =>
                                                i.id === ing.id ? { ...i, costoEstructuralMP: val, costoUnitario: val + (i.costoEstructuralEMP||0) + (i.costoEstructuralMODI||0), costoTotal: (val + (i.costoEstructuralEMP||0) + (i.costoEstructuralMODI||0)) * (i.cantidad || 0) } : i
                                              )
                                            });
                                          }} className="w-16 p-0.5 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                                        </div>
                                        <div className="flex justify-between items-center text-sm gap-1">
                                          <span className="text-slate-600">EMP:</span>
                                          <input type="number" disabled={!esCostosEditable} placeholder="0.00" value={ing.costoEstructuralEMP !== undefined ? ing.costoEstructuralEMP : ""} onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setDatosForm({
                                              ...datosForm,
                                              ingredientes: datosForm.ingredientes.map((i: any) =>
                                                i.id === ing.id ? { ...i, costoEstructuralEMP: val, costoUnitario: (i.costoEstructuralMP||0) + val + (i.costoEstructuralMODI||0), costoTotal: ((i.costoEstructuralMP||0) + val + (i.costoEstructuralMODI||0)) * (i.cantidad || 0) } : i
                                              )
                                            });
                                          }} className="w-16 p-0.5 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                                        </div>
                                        <div className="flex justify-between items-center text-sm gap-1">
                                          <span className="text-slate-600">MODI:</span>
                                          <input type="number" disabled={!esCostosEditable} placeholder="0.00" value={ing.costoEstructuralMODI !== undefined ? ing.costoEstructuralMODI : ""} onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setDatosForm({
                                              ...datosForm,
                                              ingredientes: datosForm.ingredientes.map((i: any) =>
                                                i.id === ing.id ? { ...i, costoEstructuralMODI: val, costoUnitario: (i.costoEstructuralMP||0) + (i.costoEstructuralEMP||0) + val, costoTotal: ((i.costoEstructuralMP||0) + (i.costoEstructuralEMP||0) + val) * (i.cantidad || 0) } : i
                                              )
                                            });
                                          }} className="w-16 p-0.5 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                                        </div>
                                        <div className="text-right text-xs font-black mt-0.5 border-t border-slate-200 pt-0.5">
                                          {((ing.costoEstructuralMP||0) + (ing.costoEstructuralEMP||0) + (ing.costoEstructuralMODI||0)).toLocaleString('es-CR', {style: 'currency', currency: 'CRC'})}
                                        </div>
                                      </div>
                                    ) : (
                                      (ing.tipo === 'SEMIELABORADO' || (ing.codigoNetSuite || '').toUpperCase().startsWith('SE') || (ing.tipoMaterial || '').toUpperCase() === 'SEMIELABORADO') ? (
                                        <span className="font-black text-slate-600">
                                          {((ing.costoEstructuralMP||0) + (ing.costoEstructuralEMP||0) + (ing.costoEstructuralMODI||0)).toLocaleString('es-CR', {style: 'currency', currency: 'CRC'})}
                                        </span>
                                      ) : (
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
                                          className="w-24 p-1 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100"
                                          step="0.01"
                                          min="0"
                                        />
                                      )
                                    )
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
                                    className="p-1.5 text-slate-700 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
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
                              className="px-4 py-1.5 text-right text-sm font-bold text-slate-600 uppercase tracking-widest"
                            >
                              Subtotal {seccion.label}
                            </td>

                            {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                              <td className="px-4 py-1.5 text-right font-black text-emerald-400 text-xs">
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

                      <tr className="bg-slate-50 border-t-2 border-emerald-100">
                        <td
                          colSpan={role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF' ? 5 : 4}
                          className="px-6 py-4 font-black text-slate-600 uppercase tracking-widest text-xs"
                        >
                          Costo Producción Bruto
                        </td>

                        {(role === 'COSTOS' || role === 'ADMIN' || role === 'CHEF') && (
                          <td className="px-4 py-4 text-right font-black text-emerald-600 text-lg tracking-tighter">
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

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-md"><Dna className="w-3.5 h-3.5" /></div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Rendimiento y Producción</h4>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-widest italic opacity-75">Indicadores técnicos de salida</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">


                    {/* Peso Total Obtenido */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Scale className="w-2 h-2" /> Peso Total</label>
                      <div className="flex gap-1">
                        <input type="number" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.pesoTotalCantidad || ''} onChange={(e) => {
                          const val = Number(e.target.value);
                          setDatosForm({ ...datosForm, pesoTotalCantidad: val, pesoPorcionCantidad: datosForm.porcionesCantidad ? (val / datosForm.porcionesCantidad) : 0, mermaCantidad: (datosForm.sumaTotalInsumos || 0) - val });
                        }} />
                        <select disabled={!esChefEditable} className="p-1.5 border rounded-lg font-bold bg-white outline-none text-xs" value={datosForm.pesoTotalUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoTotalUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Merma */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><TrendingUp className="w-2 h-2 text-rose-500" /> Merma</label>
                      <div className="flex gap-1">
                        <input type="number" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.mermaCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, mermaCantidad: Number(e.target.value) })} />
                        <span className="p-1.5 border rounded-lg font-bold bg-slate-100 text-slate-700 text-xs flex items-center justify-center w-10">g</span>
                      </div>
                    </div>
                    {/* Suma Total Insumos */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Scale className="w-2 h-2 text-emerald-500" /> Insumos Totales</label>
                      <div className="flex gap-1">
                        <input type="number" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.sumaTotalInsumos || ''} onChange={(e) => {
                          const val = Number(e.target.value);
                          setDatosForm({ ...datosForm, sumaTotalInsumos: val, mermaCantidad: val - (datosForm.pesoTotalCantidad || 0) });
                        }} />
                        <span className="p-1.5 border rounded-lg font-bold bg-slate-100 text-slate-700 text-xs flex items-center justify-center w-10">g</span>
                      </div>
                    </div>
                    {/* Cantidad de Porciones */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Layers className="w-2 h-2" /> Porciones</label>
                      <div className="flex gap-1">
                        <input type="number" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.porcionesCantidad || ''} onChange={(e) => {
                          const val = Number(e.target.value);
                          setDatosForm({ ...datosForm, porcionesCantidad: val, pesoPorcionCantidad: val ? ((datosForm.pesoTotalCantidad || 0) / val) : 0 });
                        }} />
                        <select disabled={!esChefEditable} className="p-1.5 border rounded-lg font-bold bg-white outline-none text-xs" value={datosForm.porcionesUnidad || 'porciones'} onChange={(e) => setDatosForm({ ...datosForm, porcionesUnidad: e.target.value })}>
                          <option value="porciones">porciones</option>
                          <option value="unidades">tandas</option>

                        </select>
                      </div>
                    </div>

                    {/* Peso por Porción */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Scale className="w-2 h-2 text-emerald-400" /> Peso X Porción</label>
                      <div className="flex gap-1">
                        <input type="number" disabled={!esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.pesoPorcionCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-1.5 border rounded-lg font-bold bg-white outline-none text-xs" value={datosForm.pesoPorcionUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>


                    {/* Tipo Costeo */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Coins className="w-2 h-2" /> Tipo Costeo</label>
                      <select disabled={!esChefEditable && !esCostosEditable} className="w-full p-1.5 border rounded-lg font-bold bg-white outline-none text-xs" value={datosForm.tipoCosteo || 'GRAMO'} onChange={(e) => setDatosForm({ ...datosForm, tipoCosteo: e.target.value as any })}>
                        <option value="GRAMO">Por Gramo</option>
                        <option value="UNIDAD">Por Unidad</option>
                      </select>
                    </div>

                    {/* Tiempo de Proceso */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Timer className="w-2 h-2" /> Tiempo Proceso (Min)</label>
                      <input type="number" disabled={!esCostosEditable && !esChefEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.tiempoProcesoMinutos || 0} onChange={(e) => setDatosForm({ ...datosForm, tiempoProcesoMinutos: Number(e.target.value) })} />
                    </div>

                    {/* % Desecho */}
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><TrendingUp className="w-2 h-2 text-rose-500" /> % Desecho</label>
                      <input type="text" disabled={true} className="w-full p-1.5 border rounded-lg font-black text-slate-500 bg-slate-100 outline-none text-[10px]" value={Number(costeoProyectado.porcentajeDesecho || 0).toFixed(2) + '%'} readOnly />
                    </div>

                    {/* Tasas MUDI / GIF (Solo visible para COSTOS/ADMIN) */}
                    {(role === 'COSTOS' || role === 'ADMIN') && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><HandCoins className="w-2 h-2" /> Tasa MODI (x Min)</label>
                          <input type="number" disabled={!esCostosEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.tasaMUDI ?? 77} onChange={(e) => setDatosForm({ ...datosForm, tasaMUDI: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1"><Factory className="w-2 h-2" /> Tasa GIF (x Min)</label>
                          <input type="number" disabled={!esCostosEditable} className="w-full p-1.5 border rounded-lg font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.tasaGIF ?? 83} onChange={(e) => setDatosForm({ ...datosForm, tasaGIF: Number(e.target.value) })} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Resultados de Costeo (Solo visibles para COSTOS) */}
                  {(role === 'COSTOS' || role === 'ADMIN') && (
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 border-dashed animate-in fade-in zoom-in duration-500">
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Mat. + Emp.</p>
                        <p className="text-xs font-black text-emerald-900">₡{((costeoProyectado.totalMP || 0) + (costeoProyectado.totalEMP || 0)).toLocaleString('es-CR', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Desecho ({datosForm.porcentajeDesecho ?? 2}%)</p>
                        <p className="text-xs font-black text-emerald-900">₡{(costeoProyectado.costoDesecho || 0).toLocaleString('es-CR', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">M.O.D.</p>
                        <p className="text-xs font-black text-emerald-900">₡{(costeoProyectado.totalMUDI || 0).toLocaleString('es-CR', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">G.I.F.</p>
                        <p className="text-xs font-black text-emerald-900">₡{(costeoProyectado.gif || 0).toLocaleString('es-CR', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-1 bg-white p-1.5 rounded-lg shadow-sm border border-emerald-100">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Total Planta</p>
                        <p className="text-lg font-black text-emerald-600 leading-none">{(costeoProyectado.costoTotalFinal || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p>
                      </div>
                      <div className="space-y-1 bg-slate-900 p-1.5 rounded-lg shadow-sm border border-slate-800">
                        <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Costo / {datosForm.tipoCosteo}</p>
                        <p className="text-lg font-black text-white leading-none">₡{((costeoProyectado.costoTotalFinal || 0) / (datosForm.tipoCosteo === 'GRAMO' ? (datosForm.pesoTotalCantidad || 1) : (datosForm.porcionesCantidad || 1))).toLocaleString('es-CR', { maximumFractionDigits: 4 })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'pasos' && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center bg-emerald-600 p-3 rounded-2xl shadow-md text-white">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5" />
                  <div><h4 className="text-xs font-black uppercase tracking-tight">IA Culinary Engine</h4><p className="text-xs opacity-80">Refina tus procesos con inteligencia artificial gastronómica.</p></div>
                </div>
                <button onClick={async () => {
                  setEstaOptimizando(true);
                  const opt = await optimizarPasosReceta(datosForm.nombre, datosForm.ingredientes.map((i: { nombre: any; }) => i.nombre));
                  if (opt) setDatosForm({ ...datosForm, pasos: opt });
                  setEstaOptimizando(false);
                }} disabled={estaOptimizando || !datosForm.nombre} className="bg-white text-emerald-600 px-3.5 py-1.5 rounded-lg font-black text-[10px] uppercase shadow-sm transition-all disabled:opacity-50">{estaOptimizando ? 'Procesando...' : 'Optimizar Pasos'}</button>
              </div>

              <div className="space-y-3">
                {esChefEditable && (
                  <div className="flex gap-3 p-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl items-center">
                    <textarea rows={2} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-xs resize-none focus:ring-2 focus:ring-emerald-100" placeholder="Describe el siguiente proceso técnico..." value={nuevoPaso} onChange={(e: { target: { value: any; }; }) => setNuevoPaso(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && nuevoPaso) { e.preventDefault(); setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} />
                    <button onClick={() => { if (nuevoPaso) { setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-sm">Añadir</button>
                  </div>
                )}

                <div className="space-y-2">
                  {datosForm.pasos.map((p: any, i: number) => (
                    <div 
                      key={i} 
                      draggable={esChefEditable}
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`flex gap-3 items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group transition-all hover:shadow-md ${
                        draggedIndex === i ? 'opacity-40 bg-slate-50 border-dashed border-slate-300' : ''
                      } ${esChefEditable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      {esChefEditable && (
                        <div className="text-slate-400 hover:text-slate-600 transition-colors">
                          <GripVertical size={14} />
                        </div>
                      )}
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">{i + 1}</div>
                      <div className="flex-1">
                        {editingPasoIndex === i ? (
                          <div className="flex gap-2 items-center w-full">
                            <textarea 
                              rows={2}
                              className="flex-1 p-2 border border-emerald-300 rounded-xl outline-none font-medium text-xs bg-emerald-50/10 focus:ring-2 focus:ring-emerald-100 resize-none"
                              value={editingPasoText} 
                              onChange={(e) => setEditingPasoText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  guardarEdicionPaso(i);
                                } else if (e.key === 'Escape') {
                                  cancelarEdicionPaso();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => guardarEdicionPaso(i)} 
                                className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                                title="Guardar cambios"
                              >
                                <Check size={12} />
                              </button>
                              <button 
                                onClick={cancelarEdicionPaso} 
                                className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg shadow-sm transition-all"
                                title="Cancelar"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p 
                            className="text-xs font-medium text-slate-700 leading-snug cursor-pointer hover:text-slate-900"
                            onClick={() => esChefEditable && iniciarEdicionPaso(i, p)}
                            title={esChefEditable ? "Haz clic para editar" : ""}
                          >
                            {p}
                          </p>
                        )}
                      </div>
                      {esChefEditable && editingPasoIndex !== i && (
                        <div className="flex gap-1 items-center">
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              disabled={i === 0} 
                              onClick={() => subirPaso(i)} 
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Subir paso"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button 
                              disabled={i === datosForm.pasos.length - 1} 
                              onClick={() => bajarPaso(i)} 
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Bajar paso"
                            >
                              <ChevronDown size={12} />
                            </button>
                          </div>
                          <button 
                            onClick={() => iniciarEdicionPaso(i, p)} 
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                            title="Editar paso"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={() => setDatosForm({ ...datosForm, pasos: datosForm.pasos.filter((_: any, idx: any) => idx !== i) })} 
                            className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Eliminar paso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {datosForm.pasos.length === 0 && (
                    <div className="text-center py-4 text-slate-600 font-medium text-sm uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
                      Aún no hay pasos en la preparación.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="p-4 bg-emerald-50 border-2 border-dashed border-emerald-100 rounded-2xl text-center">
                <History className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <h4 className="text-base font-black text-emerald-900 uppercase tracking-tight">Trazabilidad Técnica de Cambios</h4>
                <p className="text-[10px] text-emerald-500 font-medium mt-1">Sello de inmutabilidad operativa y registro de certificaciones QC.</p>
                {datosForm.fechaImpresion && (
                  <div className="mt-3 inline-block px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-black rounded-lg text-[10px] uppercase tracking-wider">
                    Última impresión en PDF: {new Date(datosForm.fechaImpresion).toLocaleString('es-CR')}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {datosForm.versiones.slice().reverse().map((v: { numeroVersion: any; fechaAprobacion: any; aprobadoPorCostos: any; codigoCalidad: any; registroCambios: any; }, i: any) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-xl">Certificado</div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 transition-colors"><BadgeCheck className="w-5 h-5 text-emerald-600" /></div>
                      <div><h4 className="text-lg font-black text-slate-900">Versión {v.numeroVersion}</h4><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Auditado el {v.fechaAprobacion}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">ID Auditor Costos</p>
                        <p className="font-bold text-xs text-slate-600">{v.aprobadoPorCostos || 'S/D'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Código QC de Control</p>
                        <p className="font-black text-emerald-600 text-xs">{v.codigoCalidad || 'S/D'}</p>
                      </div>
                      <div className="col-span-2 pt-2.5 border-t border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Registro de Cambios</p>
                        <p className="text-[10px] font-medium text-slate-700 italic">"{v.registroCambios || 'Sin cambios registrados'}"</p>
                      </div>
                    </div>
                  </div>
                ))}
                {datosForm.versiones.length === 0 && (
                  <div className="py-12 text-center text-slate-700 font-black uppercase tracking-widest text-xs italic">No existen registros históricos para esta fórmula</div>
                )}
              </div>
            </div>
          )}

          {tabActiva === 'costeo' && (role === 'COSTOS' || role === 'ADMIN') && (
            <div className="mx-auto w-full max-w-6xl space-y-4 animate-in fade-in duration-500 overflow-x-auto text-sm bg-slate-50 p-4 border rounded-2xl">
              
              {costeoProyectado.tieneSEBruto && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4 rounded-r-lg shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-amber-800 font-bold text-[10px] uppercase">Datos Estructurales Pendientes (NetSuite)</h4>
                      <p className="text-amber-700 text-[10px] leading-tight">Uno o más ingredientes tipo Semielaborado (SE) provienen de NetSuite y aún no cuentan con los campos desglosados (MP, EMP, MODI) en la base de datos externa. Por defecto, su precio total (AverageCost) se está agrupando de forma bruta en el <strong>TOTAL MATERIA PRIMA</strong>. Una vez se actualice NetSuite, los costos se redistribuirán automáticamente.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estilo tabla TEAL oscuro (Materia Prima/Ensamble) */}
              <div className="border border-teal-900 rounded-sm overflow-hidden bg-white">
                <table className="w-full text-left uppercase whitespace-nowrap">
                  <thead className="bg-teal-700 text-white font-black text-xs">
                    <tr>
                      <th className="px-2 py-1.5 border-r border-teal-600">Unidades</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 w-1/2">MATERIA PRIMA SEMIELABORADOS</th>
                      <th className="px-2 py-1.5 border-r border-teal-600">Unidades</th>
                      <th className="px-2 py-1.5 border-r border-teal-600">Und Medida</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 text-right">Costo Unitari</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 text-right">Total Costo</th>
                      <th className="px-2 py-1.5 text-center">Codigos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredientesCategorizados.ensamble.concat(ingredientesCategorizados.decoracion).map((ing: any, idx: number) => {
                      const esSemi = ing.tipo === 'SEMIELABORADO' || (ing.codigoNetSuite || '').toUpperCase().startsWith('SE') || (ing.tipoMaterial || '').toUpperCase() === 'SEMIELABORADO';
                      const costoUni = esSemi ? (ing.costoEstructuralMP !== undefined ? ing.costoEstructuralMP : 0) : (ing.costoUnitario || 0);
                      return (
                      <tr key={idx} className="hover:bg-slate-50 text-black font-bold">
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 font-medium">{ing.nombreInterno || ing.nombre} {esSemi ? '(Solo MP)' : ''}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic capitalize">{ing.unidad || 'UND'}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right">
                          {esSemi && esCostosEditable ? (
                            <input type="number" placeholder="0.00" value={ing.costoEstructuralMP !== undefined ? ing.costoEstructuralMP : ""} onChange={(e) => {
                              const val = Number(e.target.value);
                              setDatosForm({
                                ...datosForm,
                                ingredientes: datosForm.ingredientes.map((i: any) =>
                                  i.id === ing.id ? { ...i, costoEstructuralMP: val, costoUnitario: val + (i.costoEstructuralEMP||0) + (i.costoEstructuralMODI||0), costoTotal: (val + (i.costoEstructuralEMP||0) + (i.costoEstructuralMODI||0)) * (i.cantidad || 0) } : i
                                )
                              });
                            }} className="w-20 p-1 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100" />
                          ) : (
                            costoUni.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          )}
                        </td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right font-black">{(costoUni * ing.cantidad).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 text-center text-sm">{ing.codigoNetSuite || 'NUEVO'}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Estilo tabla TEAL oscuro (EMPAQUE) */}
              <div className="border border-teal-900 rounded-sm overflow-hidden bg-white mt-2">
                <table className="w-full text-left uppercase whitespace-nowrap">
                  <thead className="bg-teal-700 text-white font-black text-xs">
                    <tr>
                      <th className="px-2 py-1.5 border-r border-teal-600">Unidades</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 w-1/2">EMPAQUE</th>
                      <th className="px-2 py-1.5 border-r border-teal-600">Unidades</th>
                      <th className="px-2 py-1.5 border-r border-teal-600">Und Medida</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 text-right">Costo Unitari</th>
                      <th className="px-2 py-1.5 border-r border-teal-600 text-right">Total Costo</th>
                      <th className="px-2 py-1.5 text-center">Codigos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ingredientesCategorizados.empaque.map((ing: any, idx: number) => (
                      <tr key={`emp-${idx}`} className="hover:bg-slate-50 text-black font-bold">
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 font-medium">{ing.nombreInterno || ing.nombre}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic capitalize">{ing.unidad || 'UND'}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right">{(ing.costoUnitario || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right font-black">{((ing.costoUnitario || 0) * ing.cantidad).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 text-center text-sm">{ing.codigoNetSuite || 'NUEVO'}</td>
                      </tr>
                    ))}
                    {/* Add Semielaborado EMP costs dynamically */}
                    {ingredientesCategorizados.ensamble.concat(ingredientesCategorizados.decoracion).filter((ing: any) => (ing.tipo === 'SEMIELABORADO' || (ing.codigoNetSuite || '').toUpperCase().startsWith('SE') || (ing.tipoMaterial || '').toUpperCase() === 'SEMIELABORADO') && ing.costoEstructuralEMP > 0).map((ing: any, idx: number) => (
                      <tr key={`semi-emp-${idx}`} className="hover:bg-slate-50 text-black font-bold bg-teal-50/50">
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 font-medium">{ing.nombreInterno || ing.nombre} (Solo EMP)</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic">{ing.cantidad}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-center italic capitalize">{ing.unidad || 'UND'}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right">
                          {esCostosEditable ? (
                            <input type="number" placeholder="0.00" value={ing.costoEstructuralEMP !== undefined ? ing.costoEstructuralEMP : ""} onChange={(e) => {
                              const val = Number(e.target.value);
                              setDatosForm({
                                ...datosForm,
                                ingredientes: datosForm.ingredientes.map((i: any) =>
                                  i.id === ing.id ? { ...i, costoEstructuralEMP: val, costoUnitario: (i.costoEstructuralMP||0) + val + (i.costoEstructuralMODI||0), costoTotal: ((i.costoEstructuralMP||0) + val + (i.costoEstructuralMODI||0)) * (i.cantidad || 0) } : i
                                )
                              });
                            }} className="w-20 p-1 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100" />
                          ) : (
                            (ing.costoEstructuralEMP || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          )}
                        </td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right font-black">{((ing.costoEstructuralEMP || 0) * ing.cantidad).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 text-center text-sm">{ing.codigoNetSuite || 'NUEVO'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bloques de Resumen - Mitad Derecha */}
              <div className="flex flex-col md:flex-row gap-6 mt-6 items-start font-sans">
                
                {/* Cuadro Analítico: Costo Planta */}
                <div className="w-full md:w-3/5 space-y-4">
                  <div className="flex flex-col text-right pr-6 space-y-0.5">
                    <div className="flex justify-end gap-4"><span className="font-bold">TOTAL MATERIA PRIMA</span><span className="font-black text-blue-700 w-20">{(costeoProyectado.totalMP || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                    <div className="flex justify-end gap-4"><span className="font-bold">TOTAL EMPAQUE</span><span className="font-black text-blue-700 w-20">{(costeoProyectado.totalEMP || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                    <div className="flex justify-end gap-4"><span className="font-bold">TOTAL MATERIAS P. + EMPAQUES</span><span className="font-black text-blue-700 w-20">{((costeoProyectado.totalMP || 0)+(costeoProyectado.totalEMP || 0)).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                    <div className="flex justify-end gap-4"><span className="font-bold">TOTAL MODI</span><span className="font-black text-blue-700 w-20">{(costeoProyectado.totalMUDI || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                  </div>

                  {/* Inputs de gramos */}
                  <div className="w-48 ml-auto border border-black p-1 text-right bg-slate-100 mt-2 space-y-0.5 shadow-sm">
                    <div className="flex justify-between border-b border-white"><span className="font-bold text-xs uppercase">Gramos</span><span className="font-bold text-blue-700">{datosForm.pesoTotalCantidad}</span></div>
                    <div className="flex justify-between border-b border-white"><span className="font-bold text-xs uppercase">Peso por Unidad</span><span className="font-bold text-blue-700">{datosForm.pesoPorcionCantidad}</span></div>
                    <div className="flex justify-between border-b border-white"><span className="font-bold text-xs uppercase">Unidades Totales</span><span className="font-black">{datosForm.porcionesCantidad}</span></div>
                  </div>

                  {/* Cinta Verde Total Costo */}
                  <div className="border border-black bg-white shadow-sm font-bold uppercase mt-4">
                    <table className="w-full text-right text-xs">
                      <tbody>
                        <tr>
                          <td className="text-blue-700 px-2 py-1 w-1/2">TOTAL MATERIAS P. + EMPAQUES</td>
                          <td className="px-2 py-1">100.00%</td>
                          <td className="px-2 py-1">{((costeoProyectado.totalMP || 0)+(costeoProyectado.totalEMP || 0)).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                        </tr>
                        <tr>
                          <td className="text-black px-2 py-1">DESECHOS Y PERDIDAS</td>
                          <td className="px-2 py-1 bg-slate-200">{(costeoProyectado.porcentajeDesecho || 2).toFixed(2)}%</td>
                          <td className="px-2 py-1">{(costeoProyectado.costoDesecho || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                        </tr>
                        <tr>
                          <td className="text-black px-2 py-1 font-bold flex justify-end items-center gap-2">
                             MANO OBRA DIRECTA <span className="bg-white border border-slate-300 px-2 py-0.5 text-sm">{costeoProyectado.tiempoProcesoMinutos || 0}</span>
                          </td>
                          <td className="px-2 py-1 text-red-600 font-black">{(datosForm.tasaMUDI || 77).toFixed(2)}</td>
                          <td className="px-2 py-1 font-medium">{((costeoProyectado.tiempoProcesoMinutos || 0) * (datosForm.tasaMUDI || 77)).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                        </tr>
                        <tr className="bg-lime-300 border-t-2 border-black font-black">
                          <td colSpan={2} className="px-2 py-1">TOTAL COSTO PLANTA</td>
                          <td className="px-2 py-1 text-blue-800">
                            {(costeoProyectado.costoTotalFinal || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="w-full md:w-2/5 flex justify-end">
                  <div className="border-4 border-black bg-teal-100 p-2 shadow-xl inline-block text-sm">
                    <div className="border border-black bg-white p-2">
                      <table className="w-full text-right uppercase font-bold">
                        <tbody>
                          <tr>
                            <td className="text-blue-800 py-1 pr-3">TOTAL MATERIA PRIMA + EMPAQUE</td>
                            <td className="py-1">{(costeoProyectado.totalMP + costeoProyectado.totalEMP).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                          <tr>
                            <td className="text-blue-800 py-1 pr-3">MODI PLANTA</td>
                            <td className="py-1">{(costeoProyectado.totalMUDI).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                          <tr>
                            <td className="text-blue-800 py-1 pr-3">DESECHO</td>
                            <td className="py-1">{(costeoProyectado.costoDesecho || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                          <tr>
                            <td className="text-green-700 py-1 pr-3 font-black">COSTO PLANTA</td>
                            <td className="py-1 bg-slate-800 text-white font-black text-center">{(costeoProyectado.costoTotalFinal).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                          <tr>
                            <td className="text-blue-800 py-1 pr-3">% GIF</td>
                            <td className="py-1">{(costeoProyectado.gif || 0).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          </tr>
                          <tr className="border-t-2 border-black">
                            <td className="text-green-700 py-2 pr-3 font-black text-xs">PRECIO DE VENTA PLANTA A LOCAL</td>
                            <td className="py-2 bg-slate-800 text-white font-black text-center flex items-center justify-center gap-1">
                              <span className="text-sm">₡</span>
                              {((costeoProyectado.costoTotalFinal + (costeoProyectado.gif || 0)) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})} <span className="text-green-400">GR</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-red-600 py-1 pr-3 font-black text-xs">UNIDAD</td>
                            <td className="py-1 font-black">
                              {((costeoProyectado.costoTotalFinal + (costeoProyectado.gif || 0)) / (datosForm.porcionesCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs">
                      <p>MODI {datosForm.tasaMUDI || 77} COLONES X MIN</p>
                      <p>GIF {datosForm.tasaGIF || 83} colones min</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablas Costo por Gramo / Unidad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                <div>
                  <h4 className="text-blue-700 font-bold text-[14px] uppercase border-b-2 border-blue-100 mb-2">COSTO POR GRAMO</h4>
                  <table className="w-full text-right text-sm font-bold uppercase mb-6">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-2">TOTAL MATERIA PRIMA</td>
                        <td className="py-1 w-16">{(costeoProyectado.totalMP).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1 w-16">{datosForm.pesoTotalCantidad || 1}</td>
                        <td className="py-1 w-16 bg-[#8B8000] text-white border border-black text-center">{((costeoProyectado.totalMP) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr>
                        <td className="py-1 pr-2">TOTAL MP+DESECHO+EMPAQUE</td>
                        <td className="py-1">{(costeoProyectado.totalMP + costeoProyectado.totalEMP + costeoProyectado.costoDesecho).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.pesoTotalCantidad || 1}</td>
                        <td className="py-1 text-center">{((costeoProyectado.totalMP + costeoProyectado.totalEMP + costeoProyectado.costoDesecho) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr>
                        <td className="py-1 pr-2">MODI PREPARACION POR GRAMO</td>
                        <td className="py-1">{((costeoProyectado.tiempoProcesoMinutos)*(datosForm.tasaMUDI || 77)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.pesoTotalCantidad || 1}</td>
                        <td className="py-1 bg-[#8B8000] text-white border border-black text-center">{(((costeoProyectado.tiempoProcesoMinutos)*(datosForm.tasaMUDI || 77)) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-2">TOTAL MODI POR GRAMO</td>
                        <td className="py-1">{(costeoProyectado.totalMUDI).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.pesoTotalCantidad || 1}</td>
                        <td className="py-1 bg-[#8B8000] text-white border border-black text-center">{((costeoProyectado.totalMUDI) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr>
                        <td className="py-1 pr-2">TOTAL EMPAQUE POR GRAMO</td>
                        <td className="py-1">{(costeoProyectado.totalEMP).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.pesoTotalCantidad || 1}</td>
                        <td className="py-1 bg-[#8B8000] text-white border border-black text-center">{((costeoProyectado.totalEMP) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr className="border-2 border-black">
                        <td colSpan={3} className="py-2 pr-2 text-center bg-[#8B8000]/10">TOTAL GRAMO MP+MODI</td>
                        <td className="py-2 text-center bg-[#8B8000] text-white font-black">{((costeoProyectado.totalMP + costeoProyectado.totalMUDI) / (datosForm.pesoTotalCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-blue-700 font-bold text-[14px] uppercase border-b-2 border-blue-100 mb-2">COSTO POR UNIDAD</h4>
                  <table className="w-full text-right text-sm font-bold uppercase">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-2">TOTAL COSTO MATERIA PRIMA</td>
                        <td className="py-1 w-16">{(costeoProyectado.totalMP).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1 w-16">{datosForm.porcionesCantidad || 1}</td>
                        <td className="py-1 w-16 bg-[#8B8000] text-white border border-black text-center">{((costeoProyectado.totalMP) / (datosForm.porcionesCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr>
                        <td className="py-1 pr-2">TOTAL UNIDAD MP+DESECHO+EMPAQUE</td>
                        <td className="py-1">{(costeoProyectado.totalMP + costeoProyectado.totalEMP + costeoProyectado.costoDesecho).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.porcionesCantidad || 1}</td>
                        <td className="py-1 border border-transparent text-center">{((costeoProyectado.totalMP + costeoProyectado.totalEMP + costeoProyectado.costoDesecho) / (datosForm.porcionesCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                      <tr><td colSpan={4} className="h-2"></td></tr>
                      <tr>
                        <td className="py-1 pr-2">TOTAL MODI POR UNIDAD</td>
                        <td className="py-1">{(costeoProyectado.totalMUDI).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                        <td className="py-1">{datosForm.porcionesCantidad || 1}</td>
                        <td className="py-1 bg-[#8B8000] text-white border border-black text-center">{((costeoProyectado.totalMUDI) / (datosForm.porcionesCantidad || 1)).toLocaleString('es-CR', {minimumFractionDigits:2})}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        <div className="p-4 md:p-5 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${esCostosEditable ? 'bg-emerald-500' : 'bg-emerald-500'} rounded-full animate-pulse`}></div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
              GastroFlow Pro | Gestión {esCostosEditable ? 'de Costos' : 'Inmutable'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {esCostosEditable ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-black uppercase text-sm tracking-widest rounded-xl shadow-sm hover:bg-slate-50 transition-all"
                >
                  Salir de Edición
                </button>
                <button
                  onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: datosForm.estado })}
                  className="flex-1 md:flex-none px-8 py-2.5 bg-emerald-600 text-white font-black uppercase text-sm tracking-widest rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  Guardar Avance de Costos
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-black uppercase text-sm tracking-widest rounded-xl shadow-sm hover:bg-slate-50 transition-all">Cerrar</button>
                {esChefEditable && (
                  <>
                    <button onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: EstadoReceta.BORRADOR })} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 text-slate-700 font-black uppercase text-sm tracking-widest rounded-xl shadow-sm hover:bg-slate-200 transition-all">Borrador</button>
                    <button onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: estadoInicial })} className="flex-1 md:flex-none px-8 py-2.5 bg-emerald-600 text-white font-black uppercase text-sm tracking-widest rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">Enviar a Revisión</button>
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