import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Filter, Clock, Scale, ArrowRight, List as ListIcon, LayoutGrid, Snowflake, Flame, ChefHat, Coffee, Package, Palette, Sparkles, Utensils, Factory, Cake, HelpCircle, ChevronLeft, Layers, FolderDown, Loader2, X } from 'lucide-react';
import JSZip from 'jszip';
import { pdf } from '@react-pdf/renderer';
import ExportarRecetaPDF from './ExportarRecetaPDF';
import { useStore } from './useStore';

const normalizeArea = (rawArea: string) => {
  const a = (rawArea || '').trim().toLowerCase();
  if (a === 'duplicados') return 'Duplicados';
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
  'Duplicados': { icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-200 hover:border-amber-400 border-dashed' },
  'Área no definida': { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200 hover:border-slate-300' },
};

export default function VistaLibroRecetas({ recipes, onSelect, configRoles }: any) {
  const [search, setSearch] = useState('');
  const [libroSearchTerm, setLibroSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Estados para descarga de ZIP masiva
  const [generandoZIP, setGenerandoZIP] = useState(false);
  const [progresoActual, setProgresoActual] = useState(0);
  const [progresoTotal, setProgresoTotal] = useState(0);
  const [recetaActualZIP, setRecetaActualZIP] = useState('');

  const userRole = useStore((state) => state.role);

  const tienePermisoDescarga = useMemo(() => {
    const config = configRoles?.find((r: any) => r.rol === userRole);
    return config ? config.permisos.includes('DESCARGA_MASIVA') : false;
  }, [configRoles, userRole]);

  const descargarCategoriaZIP = async () => {
    if (filtradas.length === 0) return;
    
    setGenerandoZIP(true);
    setProgresoActual(0);
    setProgresoTotal(filtradas.length);
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < filtradas.length; i++) {
        const receta = filtradas[i];
        setRecetaActualZIP(receta.nombre);
        setProgresoActual(i + 1);
        
        // Generar ingredientes categorizados como lo hace el ExportarRecetaPDF
        const grupos = {
          ensamble: [] as any[],
          decoracion: [] as any[],
          empaque: [] as any[]
        };

        (receta.ingredientes || []).forEach((ing: any) => {
          if (ing.seccionReceta === 'ENSAMBLE') {
            grupos.ensamble.push(ing);
          } else if (ing.seccionReceta === 'DECORACION') {
            grupos.decoracion.push(ing);
          } else if (ing.seccionReceta === 'EMPAQUE') {
            grupos.empaque.push(ing);
          } else {
            const tipo = (ing.tipoMaterial || '').toUpperCase();
            if (tipo.includes('EMPAQUE')) {
              grupos.empaque.push(ing);
            } else {
              grupos.ensamble.push(ing);
            }
          }
        });

        const doc = React.createElement(ExportarRecetaPDF, {
          receta: {
            ...receta,
            ingredientesCategorizados: grupos
          }
        });
        
        const blob = await pdf(doc).toBlob();
        
        // Limpiar el nombre de la receta para el archivo local
        const cleanName = (receta.nombre || 'Receta').replace(/[\/\\?%*:|"<>]/g, '_').trim();
        const codePart = receta.codigoCalidad ? `[${receta.codigoCalidad}] ` : '';
        const fileName = `${codePart}${cleanName}.pdf`;
        
        zip.file(fileName, blob);
      }
      
      setRecetaActualZIP('Comprimiendo carpeta...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Descargar el archivo ZIP
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recetas_${selectedGroup || 'Categoria'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error al generar descarga masiva ZIP:", err);
      alert("Ocurrió un error al generar la descarga masiva de recetas. Por favor intenta de nuevo.");
    } finally {
      setGenerandoZIP(false);
    }
  };

  // Compute grouped recipes
  const groupedRecipes = useMemo(() => {
    const groups: Record<string, any[]> = {};
    Object.keys(AREA_CONFIG).forEach(k => groups[k] = []);
    
    if (!recipes || !Array.isArray(recipes)) return groups;
    
    recipes.forEach((r: any) => {
      const groupName = normalizeArea(r.areaProduce);
      if (groups[groupName]) {
        groups[groupName].push(r);
      } else {
        groups['Área no definida'].push(r);
      }
    });
    return groups;
  }, [recipes]);

  // Categorías que coinciden globalmente
  const categoriasCoincidentes = useMemo(() => {
    if (!libroSearchTerm || !libroSearchTerm.trim() || !groupedRecipes) return [];
    const term = libroSearchTerm.toLowerCase();
    return Object.keys(groupedRecipes).filter(cat => 
      cat !== 'Área no definida' && cat !== 'Duplicados' && 
      cat.toLowerCase().includes(term)
    );
  }, [groupedRecipes, libroSearchTerm]);

  // Recetas que coinciden globalmente (aprobadas)
  const recetasCoincidentes = useMemo(() => {
    if (!recipes || !Array.isArray(recipes) || !libroSearchTerm || !libroSearchTerm.trim()) return [];
    const term = libroSearchTerm.toLowerCase();
    return recipes.filter((r: any) =>
      (r.nombre && r.nombre.toLowerCase().includes(term)) ||
      (r.detalle_nombre_receta && r.detalle_nombre_receta.toLowerCase().includes(term)) ||
      (r.codigoCalidad && r.codigoCalidad.toLowerCase().includes(term)) ||
      (r.codigo_netsuite && r.codigo_netsuite.toLowerCase().includes(term))
    );
  }, [recipes, libroSearchTerm]);

  // Filter recipes within the selected group
  const filtradas = useMemo(() => {
    if (!selectedGroup || !groupedRecipes) return [];
    const groupList = groupedRecipes[selectedGroup] || [];
    const term = (search || '').toLowerCase();
    return groupList.filter((r: any) =>
      (r.nombre && r.nombre.toLowerCase().includes(term)) || 
      (r.detalle_nombre_receta && r.detalle_nombre_receta.toLowerCase().includes(term)) ||
      (r.codigoCalidad && r.codigoCalidad.toLowerCase().includes(term)) ||
      (r.codigo_netsuite && r.codigo_netsuite.toLowerCase().includes(term))
    );
  }, [groupedRecipes, selectedGroup, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!selectedGroup ? (
        // MENÚ DE ÁREAS
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-business-orange" /> Libro de Recetas
              </h1>
              <p className="text-slate-600 font-medium text-base max-w-2xl mt-1">
                Selecciona un área de producción para visualizar las recetas vigentes y aprobadas.
              </p>
            </div>
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar receta o categoría..."
                value={libroSearchTerm}
                onChange={(e) => setLibroSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange outline-none font-medium shadow-sm transition-all text-xs"
              />
              {libroSearchTerm && (
                <button
                  onClick={() => setLibroSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {libroSearchTerm.trim() ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Categorías coincidentes */}
              {categoriasCoincidentes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Áreas Encontradas</h2>
                  <div className="flex flex-wrap gap-3">
                    {categoriasCoincidentes.map(areaName => {
                      const config = AREA_CONFIG[areaName] || AREA_CONFIG['Área no definida'];
                      const Icon = config.icon;
                      const count = (groupedRecipes[areaName] || []).length;
                      return (
                        <button
                          key={areaName}
                          onClick={() => {
                            setSelectedGroup(areaName);
                            setLibroSearchTerm('');
                          }}
                          className={`flex items-center gap-2.5 px-4 py-2 bg-white border-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${config.border}`}
                        >
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-xs font-black uppercase tracking-wider ${config.color}`}>{areaName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recetas coincidentes */}
              <div className="space-y-3">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recetas Encontradas</h2>
                {recetasCoincidentes.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-2">No se encontraron recetas</h3>
                    <p className="text-slate-500 font-medium text-sm">
                      Intenta buscar con otro término en el Libro de Recetas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {recetasCoincidentes.map((r: any) => (
                      <div
                        key={r.id}
                        onClick={() => onSelect(r)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">Vigente</span>
                              {r.codigoCalidad && <span className="text-[10px] font-black bg-business-mustard/10 text-business-orange px-2 py-0.5 rounded border border-business-mustard/30 uppercase tracking-widest">{r.codigoCalidad}</span>}
                            </div>
                            <span className="text-xs font-black text-slate-700">v{r.versionActual}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-business-orange transition-colors leading-tight">
                            {r.detalle_nombre_receta || r.nombre}
                          </h3>
                          <div className="text-sm font-bold text-slate-600 uppercase mb-2">
                            Área: {normalizeArea(r.areaProduce)}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase">
                            <span className="flex items-center gap-1"><Clock size={12} /> {r.tiempoProcesoMinutos || 0}m</span>
                            <span className="flex items-center gap-1"><Scale size={12} /> {r.pesoTotalCantidad}g</span>
                          </div>
                        </div>
                        <div className="pt-3 mt-4 border-t border-slate-50 flex justify-between items-center">
                          <span className="font-black text-slate-900 text-xl tracking-tighter">
                            {(r.costoTotal || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                          </span>
                          <button className="p-2 bg-business-olive text-white rounded-lg group-hover:bg-business-orange transition-all shadow-md">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(groupedRecipes).map(([areaName, areaRecipes]) => {
                const config = AREA_CONFIG[areaName] || AREA_CONFIG['Área no definida'];
                const Icon = config.icon;
                const count = (areaRecipes as any).length;
                
                if (count === 0 && areaName === 'Área no definida') return null;
                
                return (
                  <div 
                    key={areaName}
                    onClick={() => setSelectedGroup(areaName)}
                    className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group p-6 flex flex-col items-center justify-center text-center h-48 ${config.bg} ${config.border}`}
                  >
                    <div className={`p-4 rounded-full bg-white shadow-sm mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className={`w-8 h-8 ${config.color}`} />
                    </div>
                    <h3 className={`text-lg font-black leading-tight ${config.color}`}>{areaName}</h3>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest bg-white/60 px-3 py-1 rounded-full text-slate-600">
                      {count} {count === 1 ? 'Receta' : 'Recetas'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // LISTADO DE RECETAS POR ÁREA
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div>
              <button 
                onClick={() => { setSelectedGroup(null); setSearch(''); }}
                className="mb-4 flex items-center gap-2 text-sm font-black text-slate-500 hover:text-business-orange transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 hover:border-business-orange/30"
              >
                <ChevronLeft className="w-4 h-4" /> Volver a las Áreas
              </button>
              
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = AREA_CONFIG[selectedGroup]?.icon || HelpCircle;
                  return <Icon className={`w-8 h-8 ${AREA_CONFIG[selectedGroup]?.color || 'text-slate-400'}`} />
                })()}
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedGroup}
                </h1>
              </div>
              <p className="text-slate-700 font-medium text-sm mt-1 italic">
                Mostrando {filtradas.length} recetas de {groupedRecipes[selectedGroup].length}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex gap-0.5">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-business-orange text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}><ListIcon size={16} /></button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-business-orange text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutGrid size={16} /></button>
              </div>
              {tienePermisoDescarga && filtradas.length > 0 && (
                <button
                  onClick={descargarCategoriaZIP}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8e925b] hover:bg-[#7d833c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                >
                  <FolderDown className="w-4 h-4" />
                  Descargar Categoría (ZIP)
                </button>
              )}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input type="text" placeholder={`Buscar en ${selectedGroup}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-business-mustard/20 outline-none font-medium shadow-sm transition-all text-xs" />
              </div>
            </div>
          </header>

          {filtradas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No se encontraron recetas</h3>
              <p className="text-slate-500 font-medium text-sm">
                Intenta buscar con otro término dentro del área de {selectedGroup}.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filtradas.map((r: any) => (
                <div key={r.id} onClick={() => onSelect(r)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">Vigente</span>
                        {r.codigoCalidad && <span className="text-[10px] font-black bg-business-mustard/10 text-business-orange px-2 py-0.5 rounded border border-business-mustard/30 uppercase tracking-widest">{r.codigoCalidad}</span>}
                      </div>
                      <span className="text-xs font-black text-slate-700">v{r.versionActual}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-business-orange transition-colors leading-tight">
                      {r.detalle_nombre_receta || r.nombre}
                    </h3>
                    <div className="text-sm font-bold text-slate-600 uppercase mb-2">
                      Auditado: {r.fechaRevision || 
                                (r.versiones && r.versiones.length > 0 
                                  ? new Date(r.versiones[r.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                                  : 'Pendiente')}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase">
                      <span className="flex items-center gap-1"><Clock size={12} /> {r.tiempoProcesoMinutos || 0}m</span>
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
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-black uppercase">
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
                          <div className="flex flex-col gap-1">
                            {r.codigoCalidad && <span className="text-[10px] w-max font-black bg-business-mustard/10 text-business-orange px-2 py-0.5 rounded border border-business-mustard/30 uppercase tracking-widest">{r.codigoCalidad}</span>}
                            <div className="font-black text-slate-900 text-base leading-none">
                              {r.detalle_nombre_receta || r.nombre}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-slate-600 uppercase">{selectedGroup}</span>
                            <span className="text-sm font-black text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                              Audit: {r.fechaRevision || 
                                     (r.versiones && r.versiones.length > 0 
                                       ? new Date(r.versiones[r.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                                       : 'Pendiente')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-4 items-center">
                            <span className="font-bold text-slate-600 flex items-center gap-1"><Clock size={12} className="text-business-orange" /> {r.tiempoProcesoMinutos || 0}m</span>
                            <span className="font-bold text-slate-600 flex items-center gap-1"><Scale size={12} className="text-business-orange" /> {r.pesoTotalCantidad}g</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-black text-slate-900 text-lg tracking-tighter">{r.costoTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}</td>
                        <td className="px-6 py-3 text-center"><button className="p-2 bg-business-beige text-slate-600 rounded-lg group-hover:bg-business-orange group-hover:text-white transition-all"><ArrowRight size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY DE PROGRESO ZIP */}
      {generandoZIP && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full mx-4 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Loader2 className="w-8 h-8 text-[#8e925b] animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Generando Descarga Masiva</h3>
              <p className="text-slate-500 font-medium text-sm">
                Procesando recetas del área de <strong className="text-[#8e925b]">{selectedGroup}</strong>. Por favor, no cierres esta ventana.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-widest">
                <span>Progreso</span>
                <span>{progresoActual} / {progresoTotal}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#8e925b] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progresoActual / progresoTotal) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
              <span className="text-[10px] font-black uppercase text-slate-600 block tracking-widest mb-1">Archivo actual:</span>
              <p className="text-xs font-bold text-slate-800 truncate">{recetaActualZIP}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
