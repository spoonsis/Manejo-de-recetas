import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Camera, Plus, Trash2, Search, Sparkles, History, Scale, TrendingUp, Layers, Timer, Coins, HandCoins, Factory, BadgeCheck, Eye, ShieldCheck, FileText, Dna, BookOpen, Loader2, AlertCircle, Trash, Building2, Users, Warehouse, Package, Lock, Calculator
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExportarRecetaPDF from './ExportarRecetaPDF';
import { Receta, EstadoReceta, EstadoInsumo, Rol, IngredienteReceta } from './types';
import { ESTILOS_ESTADO, ETIQUETAS_ESTADO, UNIDADES } from './constants';
import { optimizarPasosReceta } from './geminiService';
import { useStore } from './useStore';

// --- Listas de Referencia ---
// Ahora se reciben como prop 'areas'

export default function EditorReceta({ recipe, insumos, subRecipes, flujosAprobacion, onClose, onSave, onSaveInsumo, role, areas = [] }: any) {
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
      if (ing.tipo === 'SEMIELABORADO') {
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
      materiasPrimas: [] as IngredienteReceta[],
      empaque: [] as IngredienteReceta[],
      modi: [] as IngredienteReceta[]
    };

    datosForm.ingredientes.forEach((ing: IngredienteReceta) => {
      if (ing.tipo === 'SEMIELABORADO') {
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
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
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
              className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${tabActiva === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-300 hover:text-slate-400'}`}
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
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.elaboradoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, elaboradoPor: e.target.value })} placeholder="Creador..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><BadgeCheck className="w-2.5 h-2.5" /> Aprobado por</label>
                  <input list="personal-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.aprobadoPor} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, aprobadoPor: e.target.value })} placeholder="Aprobación..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Warehouse className="w-2.5 h-2.5" /> Área que Produce</label>
                  <input list="areas-prod-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.areaProduce} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaProduce: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-prod-datalist">
                    {areas.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Package className="w-2.5 h-2.5" /> Área que Empaca</label>
                  <input list="areas-emp-datalist" disabled={!esChefEditable} className="w-full p-2 border rounded-lg font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-[10px]" value={datosForm.areaEmpaca} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, areaEmpaca: e.target.value })} placeholder="Seleccionar..." />
                  <datalist id="areas-emp-datalist">
                    {areas.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid  gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Nombre del Plato / Receta</label>
                      <input type="text" disabled={!esChefEditable} value={datosForm.nombre} onChange={(e: { target: { value: any; }; }) => setDatosForm({ ...datosForm, nombre: e.target.value })}
                        className="w-full p-1.5 border rounded-xl font-black text-md outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm" />
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
                        className="w-full p-1.5 border rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm text-sm text-slate-700"
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
                    <input type="checkbox" disabled={!esChefEditable} checked={datosForm.esSemielaborado} onChange={(e: { target: { checked: any; }; }) => setDatosForm({ ...datosForm, esSemielaborado: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" id="semielaborado" />
                    <label htmlFor="semielaborado" className="cursor-pointer select-none">
                      <p className="font-black text-amber-900 uppercase text-[10px] tracking-tighter">Semielaborado</p>
                      <p className="text-[8px] text-slate-500 mt-0 font-bold uppercase tracking-tighter italic">En transformación</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-600" /> Matriz de Costeo Técnica</h3>

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
                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">Tipo Insumo</label>
                        <input
                          disabled
                          className="w-full p-2 border-none rounded-lg font-bold outline-none bg-slate-800 text-emerald-400 text-xs text-center uppercase tracking-widest cursor-not-allowed"
                          value={esProductoNuevo ? 'Nuevo' : (codigoNetSuite ? 'Existente' : '-')}
                        />
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
                          Estás creando un Insumo Nuevo. Asegúrate de proporcionar una <strong className="text-white">Descripción</strong> clara. Este insumo se guardará posteriormente en tu catálogo al guardar.
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
                        <input type="number" value={cantidadIngrediente} onChange={(e: { target: { value: any; }; }) => setCantidadIngrediente(Number(e.target.value))} className="w-full p-2 border-none rounded-lg font-black text-emerald-300 bg-slate-800 text-xs" />
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
                      <button onClick={agregarIngrediente} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">AÑADIR LINEA</button>

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
                            <td colSpan={esChefEditable ? 7 : 6} className="px-4 py-1.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
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
                                  <span className="text-[8px] text-emerald-500 font-bold mt-0.5 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                                    {ing.observaciones || 'Sin obs.'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2 text-center">
                                <div className="flex flex-col gap-0.5 items-center">
                                  <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                                    Cód: {ing.codigoICG || '-'}
                                  </span>
                                  <span className="text-[8px] font-black bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 uppercase">
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
                                      className="w-24 p-1 border rounded bg-white text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100"
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
                          className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]"
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

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md"><Dna className="w-4 h-4" /></div>
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
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.pesoTotalCantidad || ''} onChange={(e) => {
                          const val = Number(e.target.value);
                          setDatosForm({ ...datosForm, pesoTotalCantidad: val, pesoPorcionCantidad: val * (datosForm.porcionesCantidad || 0), mermaCantidad: (datosForm.sumaTotalInsumos || 0) - val });
                        }} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.pesoTotalUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoTotalUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Merma */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-rose-500" /> Merma</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.mermaCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, mermaCantidad: Number(e.target.value) })} />
                        <span className="p-2 border rounded-xl font-bold bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center w-12">g</span>
                      </div>
                    </div>
                    {/* Suma Total Insumos */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Scale className="w-2.5 h-2.5 text-emerald-500" /> Insumos Totales</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.sumaTotalInsumos || ''} onChange={(e) => {
                          const val = Number(e.target.value);
                          setDatosForm({ ...datosForm, sumaTotalInsumos: val, mermaCantidad: val - (datosForm.pesoTotalCantidad || 0) });
                        }} />
                        <span className="p-2 border rounded-xl font-bold bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center w-12">g</span>
                      </div>
                    </div>
                    {/* Cantidad de Porciones */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Layers className="w-2.5 h-2.5" /> Porciones</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.porcionesCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, porcionesCantidad: Number(e.target.value), pesoPorcionCantidad: (datosForm.pesoTotalCantidad || 0) * Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.porcionesUnidad || 'porciones'} onChange={(e) => setDatosForm({ ...datosForm, porcionesUnidad: e.target.value })}>
                          <option value="porciones">porciones</option>
                          <option value="unidades">tandas</option>

                        </select>
                      </div>
                    </div>

                    {/* Peso por Porción */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Scale className="w-2.5 h-2.5 text-emerald-400" /> Peso X Porción</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.pesoPorcionCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionCantidad: Number(e.target.value) })} />
                        <select disabled={!esChefEditable} className="p-2 border rounded-xl font-bold bg-white outline-none text-[10px]" value={datosForm.pesoPorcionUnidad || 'g'} onChange={(e) => setDatosForm({ ...datosForm, pesoPorcionUnidad: e.target.value })}>
                          {['g', 'kg', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tiempo de Preparación */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> Tiempo Prep.</label>
                      <div className="flex gap-1.5">
                        <input type="number" disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.tiempoPrepCantidad || ''} onChange={(e) => setDatosForm({ ...datosForm, tiempoPrepCantidad: Number(e.target.value) })} />
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

                    {/* MODI */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><HandCoins className="w-2.5 h-2.5" /> MODI</label>
                      <input type="number" disabled={!esCostosEditable && !esChefEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.mudi || 0} onChange={(e) => setDatosForm({ ...datosForm, mudi: Number(e.target.value) })} />
                    </div>

                    {/* GIF (Solo visible para COSTOS/ADMIN) */}
                    {(role === 'COSTOS' || role === 'ADMIN') && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1"><Factory className="w-2.5 h-2.5" /> GIF (Fijo)</label>
                        <input type="number" disabled={!esCostosEditable} className="w-full p-2 border rounded-xl font-black text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-100 text-xs" value={datosForm.gif || 0} onChange={(e) => setDatosForm({ ...datosForm, gif: Number(e.target.value) })} />
                      </div>
                    )}
                  </div>

                  {/* Resultados de Costeo (Solo visibles para COSTOS) */}
                  {(role === 'COSTOS' || role === 'ADMIN') && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 border-dashed animate-in fade-in zoom-in duration-500">
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo MP ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-emerald-900">₡{(costeoProyectado.costoUnitarioMP || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo EMP ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-emerald-900">₡{(costeoProyectado.costoUnitarioEMP || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Costo MODI ({datosForm.tipoCosteo})</p>
                        <p className="text-sm font-black text-emerald-900">₡{(costeoProyectado.costoUnitarioMUDI || 0).toFixed(4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Costo Total Final</p>
                        <p className="text-xl font-black text-emerald-600 leading-none">{(costeoProyectado.costoTotalFinal || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'pasos' && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center bg-emerald-600 p-4 rounded-3xl shadow-md text-white">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div><h4 className="text-sm font-black uppercase tracking-tight">IA Culinary Engine</h4><p className="text-[10px] opacity-80">Refina tus procesos con inteligencia artificial gastronómica.</p></div>
                </div>
                <button onClick={async () => {
                  setEstaOptimizando(true);
                  const opt = await optimizarPasosReceta(datosForm.nombre, datosForm.ingredientes.map((i: { nombre: any; }) => i.nombre));
                  if (opt) setDatosForm({ ...datosForm, pasos: opt });
                  setEstaOptimizando(false);
                }} disabled={estaOptimizando || !datosForm.nombre} className="bg-white text-emerald-600 px-4 py-1.5 rounded-xl font-black text-[9px] uppercase shadow-sm transition-all disabled:opacity-50">{estaOptimizando ? 'Procesando...' : 'Optimizar Pasos'}</button>
              </div>

              <div className="space-y-3">
                {esChefEditable && (
                  <div className="flex gap-3 p-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl items-center">
                    <textarea rows={2} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-xs resize-none focus:ring-2 focus:ring-emerald-100" placeholder="Describe el siguiente proceso técnico..." value={nuevoPaso} onChange={(e: { target: { value: any; }; }) => setNuevoPaso(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && nuevoPaso) { e.preventDefault(); setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} />
                    <button onClick={() => { if (nuevoPaso) { setDatosForm({ ...datosForm, pasos: [...datosForm.pasos, nuevoPaso] }); setNuevoPaso(''); } }} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-600 transition-all shadow-sm">Añadir</button>
                  </div>
                )}

                <div className="space-y-2">
                  {datosForm.pasos.map((p: any, i: number) => (
                    <div key={i} className="flex gap-3 items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group transition-all hover:shadow-md">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-700 leading-snug">{p}</p>
                      </div>
                      {esChefEditable && (
                        <button onClick={() => setDatosForm({ ...datosForm, pasos: datosForm.pasos.filter((_: any, idx: any) => idx !== i) })} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                  {datosForm.pasos.length === 0 && (
                    <div className="text-center py-4 text-slate-400 font-medium text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
                      Aún no hay pasos en la preparación.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-100 rounded-3xl text-center">
                <History className="w-10 h-10 text-emerald-300 mx-auto mb-4" />
                <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Trazabilidad Técnica de Cambios</h4>
                <p className="text-xs text-emerald-500 font-medium mt-1">Sello de inmutabilidad operativa y registro de certificaciones QC.</p>
              </div>

              <div className="space-y-4">
                {datosForm.versiones.slice().reverse().map((v: { numeroVersion: any; fechaAprobacion: any; aprobadoPorCostos: any; codigoCalidad: any; registroCambios: any; }, i: any) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-bl-2xl">Certificado</div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-emerald-100 transition-colors"><BadgeCheck className="w-6 h-6 text-emerald-600" /></div>
                      <div><h4 className="text-xl font-black text-slate-900">Versión {v.numeroVersion}</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Auditado el {v.fechaAprobacion}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Auditor Costos</p>
                        <p className="font-bold text-sm text-slate-600">{v.aprobadoPorCostos || 'S/D'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Código QC de Control</p>
                        <p className="font-black text-emerald-600 text-sm">{v.codigoCalidad || 'S/D'}</p>
                      </div>
                      <div className="col-span-2 pt-3 border-t border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registro de Cambios</p>
                        <p className="text-xs font-medium text-slate-500 italic">"{v.registroCambios || 'Sin cambios registrados'}"</p>
                      </div>
                    </div>
                  </div>
                ))}
                {datosForm.versiones.length === 0 && (
                  <div className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">No existen registros históricos para esta fórmula</div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 md:p-5 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${esCostosEditable ? 'bg-emerald-500' : 'bg-emerald-500'} rounded-full animate-pulse`}></div>
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
                  className="flex-1 md:flex-none px-8 py-2.5 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
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
                    <button onClick={() => onSave({ ...datosForm, ...costeoProyectado, costoTotal: costeoProyectado.costoTotalFinal, estado: EstadoReceta.PENDIENTE_COSTOS })} className="flex-1 md:flex-none px-8 py-2.5 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">Enviar a Revisión</button>
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