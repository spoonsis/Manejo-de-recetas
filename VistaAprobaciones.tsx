import React, { useState } from 'react';
import {
  FileText, Eye, RefreshCw, Lock, ShieldCheck, Save, BadgeCheck, X
} from 'lucide-react';
import { EstadoReceta } from './types';
import { ETIQUETAS_ESTADO } from './constants';
import { useStore } from './useStore';

export default function VistaAprobaciones({ pendingRecipes, pendingFichas, onApprove, onReject, onOpen, onRefreshCosts, onApproveFicha }: any) {
  const { role } = useStore();
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
              <div className="absolute top-0 right-0 p-2 bg-business-olive text-white font-black text-[7px] uppercase tracking-widest rounded-bl-lg">
                Certificación
              </div>
            )}

            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 bg-slate-50 rounded-xl border group-hover:bg-business-mustard/10 transition-colors">
                <FileText className="w-6 h-6 text-slate-400 group-hover:text-business-orange" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{r.nombre}</h3>
                  <button
                    onClick={() => onOpen(r)}
                    className="p-1.5 bg-business-mustard/10 text-business-orange rounded-lg hover:bg-business-orange hover:text-white transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-slate-900 text-white rounded-full">
                    Costo: {r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                  </span>
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-business-mustard/10 text-business-orange border border-business-mustard/20 rounded-full">
                    Fase: {ETIQUETAS_ESTADO[r.estado as EstadoReceta]}
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
                  className="w-full flex items-center justify-center gap-2 py-3 bg-business-orange text-white rounded-xl font-black text-[9px] uppercase shadow-md hover:bg-business-orange/90 active:scale-95 transition-all border border-business-orange group"
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
                        className="w-full p-3 border rounded-xl text-xs font-black focus:border-business-orange outline-none bg-slate-50"
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
                      className="flex-1 py-3 bg-business-olive text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-business-olive/20 flex items-center justify-center gap-2 hover:bg-business-olive/90 active:scale-95 transition-all"
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

        {pendingFichas && pendingFichas.map((f: any) => (
          <div key={f.id} className="bg-white p-4 rounded-2xl border flex flex-col lg:flex-row justify-between gap-4 shadow-sm relative group overflow-hidden border-emerald-100">
            <div className="absolute top-0 right-0 p-2 bg-emerald-600 text-white font-black text-[7px] uppercase tracking-widest rounded-bl-lg">
              Ficha Técnica
            </div>
            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{f.nombreReceta}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                    {f.estado.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-black uppercase px-3 py-1 bg-slate-50 text-slate-400 border rounded-full">
                    v{f.version}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 min-w-[280px] lg:border-l lg:pl-6 border-slate-100">
              <button
                onClick={() => onApproveFicha(f)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> Revisar y Certificar
              </button>
            </div>
          </div>
        ))}

        {pendingRecipes.length === 0 && (!pendingFichas || pendingFichas.length === 0) && (
          <div className="text-center p-20 bg-white border-2 border-dashed rounded-[3rem] text-slate-300 font-black uppercase tracking-widest">
            <BadgeCheck className="w-16 h-16 mx-auto mb-4 opacity-5" />
            0 Pendientes
          </div>
        )}
      </div>
    </div>
  );
}
