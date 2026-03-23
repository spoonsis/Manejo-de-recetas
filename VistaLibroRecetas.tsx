import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Filter, Clock, Scale, ArrowRight, List as ListIcon, LayoutGrid } from 'lucide-react';

const AREAS_PRODUCCION = ["Cocina Caliente", "Cuarto Frío", "Pastelería Industrial", "Panadería Artesanal", "Área de Mezclado"];

export default function VistaLibroRecetas({ recipes, onSelect }: any) {
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
            <BookOpen className="w-8 h-8 text-business-orange" /> Libro de Recetas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 italic">Versiones finales aprobadas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex gap-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-business-orange text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><ListIcon size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-business-orange text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid size={16} /></button>
          </div>
          <div className="relative w-full sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select value={areaFilter} onChange={(e: { target: { value: any; }; }) => setAreaFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-business-mustard/20 outline-none font-bold text-slate-600 appearance-none shadow-sm transition-all text-xs">
              <option value="">Todas las Áreas</option>
              {AREAS_PRODUCCION.map(area => (<option key={area} value={area}>{area}</option>))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e: { target: { value: any; }; }) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-business-mustard/20 outline-none font-medium shadow-sm transition-all text-xs" />
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
                <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-business-orange transition-colors leading-tight">{r.nombre}</h3>
                <div className="text-[8px] font-bold text-slate-400 uppercase mb-2">
                  Auditado: {r.fechaRevision || 
                            (r.versiones && r.versiones.length > 0 
                              ? new Date(r.versiones[r.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                              : 'Pendiente')}
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase">
                  <span className="flex items-center gap-1"><Clock size={12} /> {r.tiempoPrepCantidad}m</span>
                  <span className="flex items-center gap-1"><Scale size={12} /> {r.pesoTotalCantidad}g</span>
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="font-black text-slate-900 text-xl tracking-tighter">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</span>
                <button className="p-2 bg-business-olive text-white rounded-lg group-hover:bg-business-orange transition-all shadow-md"><ArrowRight className="w-4 h-4" /></button>
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{r.areaProduce || 'Sin Área'}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                          Audit: {r.fechaRevision || 
                                 (r.versiones && r.versiones.length > 0 
                                   ? new Date(r.versiones[r.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                                   : 'Pendiente')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-4 items-center">
                        <span className="font-bold text-slate-600 flex items-center gap-1"><Clock size={12} className="text-business-orange" /> {r.tiempoPrepCantidad}m</span>
                        <span className="font-bold text-slate-600 flex items-center gap-1"><Scale size={12} className="text-business-orange" /> {r.pesoTotalCantidad}g</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-black text-slate-900 text-lg tracking-tighter">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</td>
                    <td className="px-6 py-3 text-center"><button className="p-2 bg-business-beige text-slate-400 rounded-lg group-hover:bg-business-orange group-hover:text-white transition-all"><ArrowRight size={16} /></button></td>
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
