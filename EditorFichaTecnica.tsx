import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Eye, Camera, Plus, Trash2, Printer, Search, FlaskConical, AlertCircle, Building2, Users, BadgeCheck, Warehouse, Package, Dna, Clock, ArrowRightCircle, ShieldCheck, FileText, Activity, Microscope, Sparkles, ClipboardList, ArrowRight, Edit3, Settings2, BookOpen, ListIcon, LayoutGrid, Filter, Scale, Calculator, TrendingUp, Layers, Timer, Coins, HandCoins, Factory, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FichaTecnica, EstadoFicha, Rol, Receta, AspectoMicrobiologico, IngredienteReceta, EstadoInsumo, Insumo, EstadoReceta } from './types';
import { ESTILOS_ESTADO_INSUMO, ETIQUETAS_ESTADO_INSUMO, ESTILOS_ESTADO, ETIQUETAS_ESTADO, UNIDADES } from './constants';
import { optimizarPasosReceta } from './geminiService';

// --- Listas de Referencia ---
// Ahora se reciben como prop 'areas'

export default function EditorFichaTecnica({ ficha, recetasDisponibles, onClose, onSave, role, maestroMicroorganismos, setMaestroMicroorganismos, areas = [] }: { ficha: FichaTecnica, recetasDisponibles: Receta[], onClose: () => void, onSave: (f: FichaTecnica) => void, role: Rol, maestroMicroorganismos: string[], setMaestroMicroorganismos: React.Dispatch<React.SetStateAction<string[]>>, areas?: string[] }) {
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
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20"><FlaskConical className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Ficha Técnica</h2>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{datos.subsidiaria}</p>
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
            <datalist id="areas-p">{areas.map(a => <option key={a} value={a} />)}</datalist>
            <datalist id="areas-e">{areas.map(a => <option key={a} value={a} />)}</datalist>
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
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`py-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border-b-4 transition-all ${tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-300'}`}>
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
                  <select disabled={!esChefEditable} className="w-full p-2 border rounded-xl font-bold text-base bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-100" value={datos.recetaId} onChange={(e: { target: { value: string; }; }) => { 
                      const r = recetasDisponibles.find(x => x.id === e.target.value); 
                      const ingredientesTexto = r && r.ingredientes ? r.ingredientes.map((i: any) => i.nombre).join(', ') : '';
                      setDatos({ ...datos, recetaId: e.target.value, nombreReceta: r?.nombre || '', declaracionIngredientes: ingredientesTexto }); 
                   }}>
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
                  <textarea disabled={esSoloLectura} rows={1} className="w-full p-2 border rounded-xl font-medium text-sm text-emerald-700 bg-emerald-50/20" value={datos.comentariosCalidad} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, comentariosCalidad: e.target.value })} placeholder="Notas de calidad, alérgenos, etc..." />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Ingredientes (Resumen Declaración)</label>
                  <textarea disabled={esSoloLectura} rows={2} className="w-full p-2 border rounded-xl font-medium text-sm text-slate-800 bg-white" value={datos.declaracionIngredientes || ''} onChange={(e) => setDatos({...datos, declaracionIngredientes: e.target.value})} placeholder="Modifique la declaración final de ingredientes..." />
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
                
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Alérgenos (separados por coma)</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm text-amber-700 bg-amber-50/30" value={(datos.alergenos || []).join(', ')} onChange={(e: { target: { value: string; }; }) => setDatos({ ...datos, alergenos: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} placeholder="Ej. Maní, Gluten, Lácteos" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Empaque</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.empaque} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, empaque: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Almacenamiento Interno</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.almacenamientoInterno} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, almacenamientoInterno: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Punto de Venta</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.almacenamientoPuntoVenta} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, almacenamientoPuntoVenta: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Transporte</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl text-sm" value={datos.transporte} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, transporte: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Código de Barras</label>
                  <input disabled={esSoloLectura} className="w-full p-2 border rounded-xl font-mono text-sm" value={datos.codigoBarras} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, codigoBarras: e.target.value })} />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Aspectos de Rechazo</label>
                  <textarea disabled={esSoloLectura} rows={1} className="w-full p-2 border rounded-xl text-sm text-rose-700 bg-rose-50/20" value={datos.aspectoRechazo} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, aspectoRechazo: e.target.value })} />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-emerald-900 uppercase">Configuración de Pesos (g/kg)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input disabled={esSoloLectura} placeholder="Bruto" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoBruto} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoBruto: e.target.value })} />
                    <input disabled={esSoloLectura} placeholder="Neto" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoNeto} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoNeto: e.target.value })} />
                    <input disabled={esSoloLectura} placeholder="Etiqueta" className="p-2 border rounded-lg font-bold text-center text-sm" value={datos.pesoEtiqueta} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, pesoEtiqueta: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-emerald-900 uppercase block">Logística</label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled={esSoloLectura} checked={datos.requiereEtiquetaIngredientes} onChange={(e: { target: { checked: any; }; }) => setDatos({ ...datos, requiereEtiquetaIngredientes: e.target.checked })} className="w-4 h-4 rounded" id="labelreq" />
                    <label htmlFor="labelreq" className="text-[9px] font-black uppercase text-emerald-600">Etiqueta Ingredientes</label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-emerald-900 uppercase">Registro M.S.</label>
                  <input disabled={esSoloLectura} placeholder="Registro..." className="w-full p-2 border rounded-lg font-bold text-sm uppercase" value={datos.registroMS} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, registroMS: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'fisicoquimica' && (
            <><div className="space-y-8 animate-in fade-in">
              {[
                { k: 'largo', l: 'Largo (cm)' }, { k: 'ancho', l: 'Ancho (cm)' }, { k: 'altura', l: 'Altura (cm)' }, { k: 'diametro', l: 'Diám. (cm)' },
                { k: 'humedad', l: 'Hum. (%)', qc: true }, { k: 'acidezTotal', l: 'Acidez', qc: true }
              ].map(f => (
                <div key={f.k}>
                  <label className={`text-[9px] font-black uppercase block mb-1 ${f.qc ? 'text-emerald-600' : 'text-slate-400'}`}>{f.l}</label>
                  <input disabled={f.qc ? !esCalidadEditable : esSoloLectura} className={`w-full p-2 border rounded-xl font-bold text-center text-sm ${f.qc ? 'bg-emerald-50/30' : 'bg-white'}`} value={(datos.fisicas as any)[f.k]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.k as any, e.target.value)} />
                </div>
              ))}
            </div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { k: 'ph', l: 'Potencial Hidrógeno (pH)', min: 'phMin', max: 'phMax' },
                  { k: 'brix', l: 'Grados Brix (°Bx)', min: 'brixMin', max: 'brixMax' },
                  { k: 'densidad', l: 'Densidad (g/ml)', min: 'densidadMin', max: 'densidadMax' }
                ].map(f => (
                  <div key={f.k} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-3">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">{f.l}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Min</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border rounded-lg font-bold text-center text-xs" placeholder="Min" value={(datos.fisicas as any)[f.min]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.min as any, e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-emerald-600 uppercase text-center block">Target</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border border-emerald-200 rounded-lg font-black text-center text-sm bg-white" placeholder="Target" value={(datos.fisicas as any)[f.k]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.k as any, e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase text-center block">Max</label>
                        <input disabled={!esCalidadEditable} className="w-full p-2 border rounded-lg font-bold text-center text-xs" placeholder="Max" value={(datos.fisicas as any)[f.max]} onChange={(e: { target: { value: string; }; }) => manejarCambioFisico(f.max as any, e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div><div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> Perfil Organoléptico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['color', 'sabor', 'textura', 'olor'].map(o => (
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
                    disabled={esSoloLectura}
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-black text-[8px] uppercase border border-emerald-100 transition disabled:opacity-50"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Pre-cargar
                  </button>
                  <button onClick={agregarMicro} disabled={esSoloLectura} className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-[8px] uppercase hover:bg-slate-800 transition disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Agregar</button>
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
                          <input list="micros-list" disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg font-bold bg-white text-xs disabled:opacity-60" value={m.microorganismo} onChange={(e: { target: { value: string; }; }) => actualizarMicro(i, 'microorganismo', e.target.value)} />
                        </td>
                        <td className="px-4 py-1.5"><input disabled={esSoloLectura} className="w-full p-1.5 border rounded-lg text-xs disabled:opacity-60" value={m.detalle} onChange={(e: { target: { value: string; }; }) => actualizarMicro(i, 'detalle', e.target.value)} /></td>
                        <td className="px-4 py-1.5 text-center">
                          <button disabled={esSoloLectura} onClick={() => { const nuevos = datos.aspectosMicrobiologicos.filter((_: any, idx: any) => idx !== i); setDatos({ ...datos, aspectosMicrobiologicos: nuevos }); }} className="p-1 px-2 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
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
                  <label className="text-[8px] font-black text-emerald-300 uppercase tracking-widest block">Certificación Final</label>
                  <div className="flex gap-2">
                    <input disabled={!esCalidadEditable} className="flex-1 p-2 rounded-lg font-black text-lg bg-slate-800 text-white" placeholder="QC-PASS" value={datos.codigoCalidadPropio} onChange={(e: { target: { value: any; }; }) => setDatos({ ...datos, codigoCalidadPropio: e.target.value })} />
                    <div className="p-2.5 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><ShieldCheck className="w-6 h-6" /></div>
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
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-200 text-slate-300 transition-all">
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
                <button onClick={() => handleGuardar(true)} className="px-8 py-2 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2">
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
            <FlaskConical className="w-8 h-8 text-emerald-600" />
            Repositorio de Fichas Técnicas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 italic">Certificación legal, física y microbiológica de productos terminados.</p>
        </div>
        {(role === 'CHEF' || role === 'ADMIN') && (
          <button onClick={onCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all">
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
            <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight mb-1">{f.nombreReceta}</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">{f.subsidiaria}</p>
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
    { label: 'Versiones Totales', value: recipes.length, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50', vista: 'recetas' },
    { label: 'Vigentes Aprobadas', value: new Set(recipes.filter((r: any) => r.estado === EstadoReceta.APROBADO).map((r: any) => r.nombre)).size, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', vista: 'libro' },
    { label: 'Insumos', value: insumos.length, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', vista: 'inventario' },
    { label: 'En Revisión', value: recipes.filter((r: any) => r.estado.includes('PENDIENTE')).length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', vista: 'aprobaciones' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-emerald-600" />
          Panel de Control
        </h1>
        <p className="text-slate-500 font-medium text-[11px] mt-1 italic uppercase tracking-wider">Perfil: <span className="text-emerald-600 font-black">{role}</span></p>
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