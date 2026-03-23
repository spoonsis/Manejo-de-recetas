import React from 'react';
import { FlaskConical, Plus, Edit3, RefreshCw, Printer } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExportarFichaTecnicaPDF from './ExportarFichaTecnicaPDF';
import { FichaTecnica, EstadoFicha, Rol, Receta } from './types';
import { useStore } from './useStore';
import { Skeleton } from './components/Skeleton';

export default function VistaFichasTecnicas({ fichas, onEdit, onCreate, onInactivate, allRecipes }: { fichas: FichaTecnica[], onEdit: (f: FichaTecnica) => void, onCreate: () => void, onInactivate: (id: string) => void, allRecipes: Receta[] }) {
  const { role, isLoadingData } = useStore();
  const filtradas = fichas.filter(f => f.estado !== EstadoFicha.INACTIVA || role === 'ADMIN');
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-business-orange" />
            Repositorio de Fichas Técnicas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 italic">Certificación legal, física y microbiológica de productos terminados.</p>
        </div>
        {(role === 'CHEF' || role === 'ADMIN') && (
          <button onClick={onCreate} className="flex items-center gap-2 bg-business-orange text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-business-orange/90 transition-all">
            <Plus className="w-4 h-4" /> Iniciar Ficha
          </button>
        )}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingData ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Skeleton variant="circular" className="h-8 w-8" />
                <div className="flex flex-col gap-1 w-full">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))
        ) : filtradas.map(f => {
          const recetaRelacionada = allRecipes.find(r => r.id === f.recetaId);
          return (
            <div key={f.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all flex flex-col relative overflow-hidden">
              {f.estado === EstadoFicha.INACTIVA && <div className="absolute top-0 right-0 p-2 bg-rose-500 text-white font-black text-[8px] uppercase tracking-widest rounded-bl-xl">Archivada</div>}
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm ${f.estado === EstadoFicha.COMPLETA ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                  {f.estado.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-black text-slate-300">v{f.version}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-business-orange transition-colors uppercase leading-tight mb-1">{f.nombreReceta}</h3>
              <p className="text-[10px] font-black text-business-orange uppercase tracking-widest mb-3">{f.subsidiaria}</p>
              <div className="flex items-center gap-2 mb-4">
                <img src={`https://ui-avatars.com/api/?name=${f.elaboradoPor}&background=F5EBE0&color=EF8E19`} className="w-5 h-5 rounded-full border" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Elaborado</span>
                  <span className="text-[9px] font-bold text-slate-600">{f.elaboradoPor}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => onEdit(f)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] hover:bg-slate-800 transition-all">
                  <Edit3 className="w-3.5 h-3.5" /> Gestionar
                </button>
                {f.estado === EstadoFicha.COMPLETA && role === 'CALIDAD' && (
                  <PDFDownloadLink
                    document={<ExportarFichaTecnicaPDF ficha={f} receta={recetaRelacionada} />}
                    fileName={`FT_${f.nombreReceta.replace(/\s+/g, '_')}_v${f.version}.pdf`}
                    className="flex items-center justify-center bg-teal-600 text-white w-10 rounded-xl hover:bg-teal-700 transition-all shadow-md group/pdf relative"
                  >
                    {({ loading }: any) => (
                      <>
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] text-white px-2 py-1 rounded opacity-0 group-hover/pdf:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Imprimir Ficha</span>
                      </>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
