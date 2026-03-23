import React, { useState, useMemo } from 'react';
import { BookOpen, X, Calculator, Clock, Scale, Sparkles, History, Eye, ShieldCheck, FileText, Camera } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExportarRecetaPDF from './ExportarRecetaPDF';
import { Receta, Rol, Insumo, IngredienteReceta, EstadoReceta } from './types';
import { ESTILOS_ESTADO, ETIQUETAS_ESTADO } from './constants';
import { useStore } from './useStore';

export default function VisorRecetaLibro({ recipe, allRecipes, insumos, onClose }: { recipe: Receta, allRecipes: Receta[], insumos: Insumo[], onClose: () => void }) {
  const { role } = useStore();
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
                <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Aprobado Por</p><p className="font-bold text-xs">{recetaActiva.aprobadoPor || '---'}</p></div>
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
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50/20">
                            <td colSpan={4} className="px-4 py-1 text-right text-[8px] font-bold text-slate-400 uppercase">Subtotal {seccion.label}</td>
                            <td className="px-4 py-1 text-right font-black text-slate-600 text-xs">
                              {seccion.data.reduce((s: any, i: { costoTotal: any; }) => s + i.costoTotal, 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                            </td>
                          </tr>
                          {/* Snapshot values for audit */}
                          {ingredientesCategorizados.materiasPrimas.concat(ingredientesCategorizados.empaque, ingredientesCategorizados.modi).some((i: { snapshotCostoUnitario: any; }) => i.snapshotCostoUnitario) && (
                            <tr className="bg-amber-50/30">
                              <td colSpan={5} className="px-4 py-1 text-[7px] font-bold uppercase text-amber-600 italic tracking-widest">Dato Histórico: Snapshot de costos capturado en aprobación</td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      <tr className="bg-slate-50 font-black text-indigo-600 border-t-2 border-indigo-100">
                        <td colSpan={4} className="px-4 py-3 uppercase text-[9px] tracking-widest">COSTO TOTAL PRODUCCIÓN</td>
                        <td className="px-4 py-3 text-right text-base">
                          {recetaActiva.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Datos de Rendimiento */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-[8px] text-emerald-500 font-black uppercase mb-0.5">Insumos Totales</p><p className="font-bold text-xs text-slate-700">{recetaActiva.sumaTotalInsumos ? `${recetaActiva.sumaTotalInsumos} g` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Peso Total</p><p className="font-bold text-xs text-slate-700">{recetaActiva.pesoTotalCantidad ? `${recetaActiva.pesoTotalCantidad} ${recetaActiva.pesoTotalUnidad}` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Merma</p><p className="font-bold text-xs text-rose-500">{recetaActiva.mermaCantidad !== undefined && recetaActiva.mermaCantidad !== null ? `${recetaActiva.mermaCantidad} g` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Porciones</p><p className="font-bold text-xs text-slate-700">{recetaActiva.porcionesCantidad ? `${recetaActiva.porcionesCantidad} ${recetaActiva.porcionesUnidad}` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Peso Porción</p><p className="font-bold text-xs text-slate-700">{recetaActiva.pesoPorcionCantidad ? `${recetaActiva.pesoPorcionCantidad} ${recetaActiva.pesoPorcionUnidad}` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Tiempo Prep.</p><p className="font-bold text-xs text-slate-700">{recetaActiva.tiempoPrepCantidad ? `${recetaActiva.tiempoPrepCantidad} ${recetaActiva.tiempoPrepUnidad}` : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Tipo Costeo</p><p className="font-bold text-xs text-slate-700">{recetaActiva.tipoCosteo || '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">MODI</p><p className="font-bold text-xs text-slate-700">{recetaActiva.mudi !== undefined ? recetaActiva.mudi : '---'}</p></div>
                  <div><p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">GIF (Fijo)</p><p className="font-bold text-xs text-slate-700">{recetaActiva.gif !== undefined ? recetaActiva.gif : '---'}</p></div>
                </div>
              </div>

              {/* Resultados de Costeo */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 border-dashed rounded-3xl mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Costo MP ({recetaActiva.tipoCosteo})</p><p className="text-sm font-black text-indigo-900">₡{Number(recetaActiva.costoUnitarioMP || 0).toFixed(4)}</p></div>
                  <div><p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Costo EMP ({recetaActiva.tipoCosteo})</p><p className="text-sm font-black text-indigo-900">₡{Number(recetaActiva.costoUnitarioEMP || 0).toFixed(4)}</p></div>
                  <div><p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Costo MODI ({recetaActiva.tipoCosteo})</p><p className="text-sm font-black text-indigo-900">₡{Number(recetaActiva.costoUnitarioMUDI || 0).toFixed(4)}</p></div>
                  <div className="border-t border-indigo-100 md:border-t-0 md:border-l pl-0 md:pl-4 pt-4 md:pt-0"><p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Costo Total Planta</p><p className="text-base font-black text-indigo-600 leading-none">{Number(recetaActiva.costoTotalFinal || recetaActiva.costoTotal || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p></div>
                </div>
              </div>
            </div>
          )}

          {tab === 'preparacion' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Guía de Elaboración Paso a Paso
              </h3>
              <div className="space-y-3">
                {recetaActiva.pasos.map((paso: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 border rounded-2xl hover:border-indigo-200 transition-all">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</div>
                    <div className="flex-1 text-slate-700 font-medium text-sm leading-snug pt-1">{paso}</div>
                  </div>
                ))}
              </div>
              {recetaActiva.pasos.length === 0 && (
                <div className="text-center py-20 opacity-20">No hay pasos registrados para esta versión de la receta.</div>
              )}
            </div>
          )}

          {tab === 'historial' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Cronograma de Evolución y Copias
              </h3>
              <div className="relative pl-8 border-l-2 border-slate-100 space-y-6">
                {versionesGuardadas.map((v: { id: any; versionActual: any; estado: string | number; ultimoRegistroCambios: any; costoTotal: number; ingredientes: string | any[]; }) => (
                  <div key={v.id} className="relative group">
                    <div className={`absolute -left-[37px] top-0 w-8 h-8 ${v.id === recetaActiva.id ? 'bg-indigo-600' : 'bg-slate-200'} text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md transition-colors`}>
                      v{v.versionActual}
                    </div>
                    <div className={`bg-white border rounded-2xl p-5 shadow-sm group-hover:shadow-md transition-all ${v.id === recetaActiva.id ? 'ring-2 ring-indigo-600' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Estado: {ETIQUETAS_ESTADO[v.estado]}</p>
                          <p className="text-base font-black text-slate-900 mt-0.5">ID Único: {v.id}</p>
                        </div>
                        <div className="flex gap-2">
                          {v.id === recetaActiva.id ? (
                            <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1"><Eye className="w-3 h-3" /> Visualizando</span>
                          ) : (
                            <button
                              onClick={() => setRecetaActiva(v as any)}
                              className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase hover:bg-indigo-600 transition-all"
                            >
                              Ver esta versión
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Resumen de Cambios:</p>
                        <p className="text-slate-600 text-sm font-medium leading-snug italic">"{v.ultimoRegistroCambios || 'Sin descripción detallada'}"</p>
                      </div>
                      <div className="mt-4 flex gap-6">
                        <div><p className="text-[8px] text-slate-400 font-bold uppercase">Costo Total</p><p className="text-sm font-black text-slate-800">{v.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</p></div>
                        <div><p className="text-[8px] text-slate-400 font-bold uppercase">Ing.</p><p className="text-sm font-black text-slate-800">{v.ingredientes.length}</p></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Visor */}
        <div className="p-6 border-t bg-slate-50/80 flex flex-wrap gap-4 justify-between items-center rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seguridad GastroFlow</p>
              <p className="text-[8px] font-bold text-slate-400 italic">
                Auditado técnicamente el {recetaActiva.fechaRevision || 
                 (recetaActiva.versiones && recetaActiva.versiones.length > 0 
                   ? new Date(recetaActiva.versiones[recetaActiva.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                   : 'Pendiente')}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {role === 'CALIDAD' && recetaActiva.estado === EstadoReceta.APROBADO && (
              <PDFDownloadLink
                document={<ExportarRecetaPDF receta={{ ...recetaActiva, ingredientesCategorizados: ingredientesCategorizados as any }} />}
                fileName={`Receta_${recetaActiva.nombre || 'Sin_Nombre'}.pdf`}
                className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                {({ loading }) => (
                  <>
                    <FileText className="w-4 h-4" />
                    {loading ? 'Preparando...' : 'Descargar PDF'}
                  </>
                )}
              </PDFDownloadLink>
            )}

            <button onClick={onClose} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-400 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
              Cerrar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
