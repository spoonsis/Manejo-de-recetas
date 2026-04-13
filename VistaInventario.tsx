import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Tag,
    Filter,
    Package,
    ShieldCheck,
    Save,
    X,
    FileText,
    Upload,
    Trash2,
    Download
} from 'lucide-react';
import { Insumo, EstadoInsumo, Rol, FaseFluxoInsumo } from './types';
import { ESTILOS_ESTADO_INSUMO, ETIQUETAS_ESTADO_INSUMO, MAPA_CONVERSION_UNIDADES, UNIDADES, UNIDADES_STOCK, TIPOS_MATERIAL, OPCIONES_IMPUESTO } from './constants';

interface VistaInventarioProps {
    insumos: Insumo[];
    onSave: (i: Insumo) => void;
    onDelete: (id: string) => void;
    role: Rol;
    fasesConfig: FaseFluxoInsumo[];
    proveedores: any[];
}

export default function VistaInventario({ insumos, onSave, onDelete, role, fasesConfig, proveedores }: VistaInventarioProps) {
    const [editando, setEditando] = useState<Insumo | null>(null);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [tabActiva, setTabActiva] = useState<'INTERNA' | 'EXTERNA'>('EXTERNA');

    // Calcular progreso dinámico basado en la configuración de fases
    const calcularProgreso = (i: Insumo) => {
        // Obtenemos todos los campos requeridos de las fases activas
        const camposRequeridos = fasesConfig
            .filter(f => f.activo)
            .flatMap(f => f.campos);

        if (camposRequeridos.length === 0) return 0;

        const completados = camposRequeridos.filter(campo => {
            const valor = i[campo];
            if (Array.isArray(valor)) return valor.length > 0;
            if (typeof valor === 'boolean') return true;
            if (typeof valor === 'number') return valor > 0;
            return valor && valor !== '';
        }).length;

        return Math.round((completados / camposRequeridos.length) * 100);
    };

    const insumosFiltrados = useMemo(() => {
        const textoBusqueda = terminoBusqueda?.toLowerCase() || "";

        return insumos.filter(i => {
            const nombre = i.nombre?.toLowerCase() || "";
            const proveedor = i.proveedor?.toLowerCase() || "";
            const marca = i.marca?.toLowerCase() || "";
            const id = i.id?.toLowerCase() || "";

            const cumpleBusqueda =
                nombre.includes(textoBusqueda) ||
                proveedor.includes(textoBusqueda) ||
                marca.includes(textoBusqueda) ||
                id.includes(textoBusqueda);

            const cumpleFiltro =
                filtroEstado === 'TODOS' || i.estado === filtroEstado;

            return cumpleBusqueda && cumpleFiltro;
        });
    }, [insumos, terminoBusqueda, filtroEstado]);

    const insumosInternos = useMemo(() => insumosFiltrados.filter(i => i.source !== 'EXTERNA'), [insumosFiltrados]);
    const insumosExternos = useMemo(() => insumosFiltrados.filter(i => i.source === 'EXTERNA'), [insumosFiltrados]);

    const renderTabla = (lista: Insumo[], titulo: string, subtitulo: string, colorClass: string) => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className={`px-6 py-4 border-b flex flex-col gap-1 ${colorClass}`}>
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800">{titulo}</h2>
                    <span className="text-[10px] font-black text-business-orange bg-white/70 px-2 py-0.5 rounded-full shadow-sm">{lista.length}</span>
                </div>
                <p className="text-[10px] text-business-olive font-medium">{subtitulo}</p>
            </div>
            <div className="overflow-x-auto inner-scroll">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[9px] sticky top-0 z-10 border-b">
                        <tr>
                            <th className="px-6 py-3">Insumo / Proveedor</th>
                            <th className="px-6 py-3">Progreso Certificación</th>
                            <th className="px-6 py-3 text-right">Compra</th>
                            <th className="px-6 py-3 text-right">Costo Unit.</th>
                            <th className="px-6 py-3 text-center">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {lista.map((i) => {
                            const prog = calcularProgreso(i);
                            return (
                                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${prog === 100 ? 'bg-business-olive' : 'bg-business-orange'}`}>
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-[13px] leading-tight flex items-center gap-2">
                                                    {i.nombre || 'Sin Nombre'}
                                                    {i.source === 'EXTERNA' && <span className="text-[8px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">NetSuite</span>}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-1.5">
                                                    <Tag size={9} className="text-business-orange" /> {i.proveedor || 'No Definido'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="space-y-1.5 max-w-[180px]">
                                            <div className="flex justify-between items-center px-0.5">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm ${ESTILOS_ESTADO_INSUMO[i.estado]}`}>
                                                    {ETIQUETAS_ESTADO_INSUMO[i.estado]}
                                                </span>
                                                <span className="text-[9px] font-black text-business-orange">{prog}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-business-beige rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out ${prog === 100 ? 'bg-business-olive' : 'bg-business-orange'}`}
                                                    style={{ width: `${prog}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="font-bold text-slate-600 text-xs">
                                            {(i.precioCompra ?? 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                                        </div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase">x{i.cantidadCompra} {i.unidad}</div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="font-black text-slate-900 text-sm tracking-tight">
                                            {(i.precioPorUnidad || 0).toLocaleString('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 2 })}
                                            <span className="text-[9px] text-slate-400 ml-0.5 font-bold">/{i.unidadConsumo || 'g'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditando(i)} className="p-2 bg-white border border-slate-200 text-business-orange rounded-lg hover:bg-business-beige transition-all shadow-sm">
                                                <FileText size={14} />
                                            </button>
                                            {(role === 'ADMIN' || role === 'COMPRAS') && (
                                                <button onClick={() => onDelete(i.id)} className="p-2 bg-white border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50 transition-all shadow-sm">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Package className="w-8 h-8 text-business-orange" />
                        Inventario Maestro
                    </h1>
                    <p className="text-slate-500 font-medium italic text-[11px] mt-1">
                        Gestión certificada de materias primas y suministros.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código o descripción..."
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-business-mustard/20 outline-none text-xs font-medium shadow-sm transition-all"
                        />
                    </div>
                    <div className="relative md:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <select
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                            className="w-full pl-9 pr-6 py-2 bg-white border border-slate-200 rounded-xl appearance-none font-bold text-[10px] text-slate-600 focus:ring-4 focus:ring-business-mustard/20 outline-none shadow-sm cursor-pointer"
                        >
                            <option value="TODOS">Todos los Estados</option>
                            {Object.values(EstadoInsumo).map(e => (
                                <option key={e} value={e}>{ETIQUETAS_ESTADO_INSUMO[e]}</option>
                            ))}
                        </select>
                    </div>
                    {(role === 'CHEF' || role === 'COMPRAS' || role === 'ADMIN') && (
                        <button
                            onClick={() => setEditando({
                                id: Math.random().toString(36).substr(2, 9),
                                nombre: '',
                                marca: '',
                                estado: EstadoInsumo.PENDIENTE_COMPRAS,
                                source: 'INTERNA',
                                tipoMaterial: 'Materia Prima',
                                unidad: 'kg',
                                unidadStock: 'kg',
                                pesoBruto: 0,
                                pesoNeto: 0,
                                precioCompra: 0,
                                tipoImpuesto: 'Exento',
                                proveedor: '',
                                codigoBarras: '',
                                locales: 'No',
                                documentos: [],
                                lote: false,
                                alergenos: false,
                                descripcionAlergenos: '',
                                tipoAlmacenamiento: '',
                                seccionAlisto: '',
                                clasificacion: '',
                                unidadConsumo: 'g',
                                factorConversion: 0.001,
                                cantidadConvertida: 1,
                                precioPorUnidad: 0,
                                cantidadCompra: 1
                            })}
                            className="flex items-center gap-1.5 bg-business-orange text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-business-orange/90 transition-all active:scale-95"
                        >
                            <Plus size={14} /> Nuevo Insumo
                        </button>
                    )}
                </div>
            </header>

            <div className="flex border-b border-slate-200 mt-2 px-6 gap-8 bg-white shrink-0">
                <button
                    onClick={() => setTabActiva('EXTERNA')}
                    className={`py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${tabActiva === 'EXTERNA' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        Insumos Externos (NetSuite)
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabActiva === 'EXTERNA' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                            {insumosExternos.length}
                        </span>
                    </div>
                </button>
                <button
                    onClick={() => setTabActiva('INTERNA')}
                    className={`py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${tabActiva === 'INTERNA' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        Insumos Nuevos
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabActiva === 'INTERNA' ? 'bg-business-mustard/20 text-business-orange' : 'bg-slate-100 text-slate-500'}`}>
                            {insumosInternos.length}
                        </span>
                    </div>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto inner-scroll space-y-6 pb-6 mt-2 pr-2 px-6">
                {tabActiva === 'INTERNA' && (
                    <>
                        {insumosInternos.length > 0 ? (
                            renderTabla(insumosInternos, "Insumos Locales", "Gestionados en la plataforma", "bg-slate-50/50")
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
                                <Package className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">No hay coincidencias en "Insumos Locales" con ese código o descripción.</p>
                            </div>
                        )}
                    </>
                )}

                {tabActiva === 'EXTERNA' && (
                    <>
                        {insumosExternos.length > 0 ? (
                            renderTabla(insumosExternos, "Insumos NetSuite", "Sincronizados desde el ERP", "bg-sky-50/50")
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
                                <Package className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">No hay coincidencias en "Insumos NetSuite" con ese código o descripción.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {editando && (
                <EditorInsumo
                    insumo={editando}
                    onClose={() => setEditando(null)}
                    onSave={(i) => { onSave(i); setEditando(null); }}
                    role={role}
                    fasesConfig={fasesConfig}
                    proveedores={proveedores}
                />
            )}
        </div>
    );
}

function EditorInsumo({ insumo, onClose, onSave, role, fasesConfig, proveedores }: { insumo: Insumo, onClose: () => void, onSave: (i: Insumo) => void, role: Rol, fasesConfig: FaseFluxoInsumo[], proveedores: any[] }) {
    const [datos, setDatos] = useState<Insumo>(insumo);
    const fasesActivas = fasesConfig.filter(f => f.activo).sort((a, b) => a.orden - b.orden);
    const [faseActivaId, setFaseActivaId] = useState<string>(fasesActivas[0]?.id || '');
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);

    React.useEffect(() => {
        if (!faseActivaId && fasesActivas.length > 0) {
            setFaseActivaId(fasesActivas[0].id);
        }
    }, [fasesActivas]);

    const handleFieldChange = (field: keyof Insumo, value: any) => {
        const nuevosDatos = { ...datos, [field]: value };

        // Auto-Factor de Conversión basado en unidades estándar
        if (field === 'unidad' || field === 'unidadConsumo') {
            const uCompra = field === 'unidad' ? value : datos.unidad;
            const uConsumo = field === 'unidadConsumo' ? value : datos.unidadConsumo;

            if (MAPA_CONVERSION_UNIDADES[uCompra] && MAPA_CONVERSION_UNIDADES[uConsumo]) {
                const famCompra = MAPA_CONVERSION_UNIDADES[uCompra].familia;
                const famConsumo = MAPA_CONVERSION_UNIDADES[uConsumo].familia;

                if (famCompra === famConsumo) {
                    nuevosDatos.factorConversion = MAPA_CONVERSION_UNIDADES[uCompra].valor / MAPA_CONVERSION_UNIDADES[uConsumo].valor;
                }
            }
        }

        // Cálculos Reactivos de Costos
        const pCompra = nuevosDatos.precioCompra || 0;
        const cCompra = nuevosDatos.cantidadCompra || 1;
        const factor = nuevosDatos.factorConversion || 1;

        nuevosDatos.precioPorUnidad = (pCompra / cCompra) / factor;
        nuevosDatos.cantidadConvertida = cCompra * factor;

        setDatos(nuevosDatos);
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubiendoArchivo(true);
        const formData = new FormData();
        formData.append('archivo', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                const nuevosDocs = [...(datos.documentos || []), { url: data.url, nombre: data.originalName }];
                handleFieldChange('documentos', nuevosDocs);
            } else {
                alert("Error al subir el archivo.");
            }
        } catch (error) {
            console.error("Error upload:", error);
            alert("Error de conexión al subir.");
        } finally {
            setSubiendoArchivo(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        const nuevosDocs = [...(datos.documentos || [])];
        nuevosDocs.splice(index, 1);
        handleFieldChange('documentos', nuevosDocs);
    };

    const faseActual = fasesActivas.find(f => f.id === faseActivaId);
    const puedeEditarFase = (fase: FaseFluxoInsumo) => {
        if (role === 'ADMIN') return true;
        return role === fase.rolResponsable;
    };
    const esEditableActual = faseActual ? puedeEditarFase(faseActual) : false;

    const renderCampo = (campo: keyof Insumo) => {
        const label = campo === 'clasificacion' ? 'GRUPO DE PROCESO DE ARTICULOS' : campo.replace(/([A-Z])/g, ' $1').toUpperCase();

        if (campo === 'locales') {
            return (
                <div key={campo} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">CREAR EN LOCALES:</label>
                    <select
                        value={datos[campo] as string || 'No'}
                        onChange={e => handleFieldChange(campo, e.target.value)}
                        disabled={!esEditableActual}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-business-mustard/10 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="Si">Si</option>
                        <option value="No">No</option>
                        <option value="Ambos">Ambos</option>
                    </select>
                </div>
            );
        }

        if (typeof datos[campo] === 'boolean' || campo === 'lote' || campo === 'alergenos') {
            return (
                <div key={campo} className="flex items-center gap-2 p-3 bg-business-beige/30 rounded-xl border border-business-mustard/10">
                    <input type="checkbox" checked={!!datos[campo]} onChange={e => handleFieldChange(campo, e.target.checked)} disabled={!esEditableActual} className="w-5 h-5 text-business-orange rounded" />
                    <label className="text-[10px] font-black text-business-olive uppercase">{label}</label>
                </div>
            );
        }

        if (campo === 'documentos') {
            const docsList = Array.isArray(datos.documentos) ? datos.documentos : [];
            return (
                <div key={campo} className="col-span-full space-y-3">
                    <label className="text-[9px] font-black text-slate-400 border-b pb-1 w-full block uppercase mb-1.5">{label}</label>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        {docsList.map((doc: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-business-mustard/20 text-business-orange rounded-lg shrink-0">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 pr-12">
                                        <p className="text-xs font-bold text-slate-700 truncate">{doc.nombre || 'Documento adjunto'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <a href={`${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-wider text-business-orange hover:text-business-olive flex items-center gap-1">
                                                <Download className="w-3 h-3" /> Descargar
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                {esEditableActual && (
                                    <button onClick={() => handleRemoveFile(idx)} className="absolute right-3 p-1.5 bg-white text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {esEditableActual && (
                        <div className="relative">
                            <input type="file" onChange={handleUploadFile} disabled={subiendoArchivo || !esEditableActual} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={`p-6 border-2 border-dashed ${subiendoArchivo ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'} rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2 transition-all`}>
                                <Upload className={`w-8 h-8 ${subiendoArchivo ? 'text-indigo-400 animate-bounce' : 'text-slate-400'}`} />
                                <span className="text-xs font-bold">{subiendoArchivo ? 'Subiendo archivo...' : 'Haz clic o arrastra un archivo aquí'}</span>
                                <span className="text-[9px] text-slate-400 font-medium">Soporta PDF, Word, Excel, Excel y más.</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (['unidad', 'unidadStock', 'unidadConsumo', 'tipoMaterial', 'tipoImpuesto'].includes(campo)) {
            let opciones: string[] = [];
            if (campo === 'unidad' || campo === 'unidadConsumo') opciones = UNIDADES;
            else if (campo === 'unidadStock') opciones = UNIDADES_STOCK;
            else if (campo === 'tipoMaterial') opciones = TIPOS_MATERIAL;
            else if (campo === 'tipoImpuesto') opciones = OPCIONES_IMPUESTO;
            
            return (
                <div key={campo} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">{label}</label>
                    <select
                        value={datos[campo] as any || ''}
                        onChange={e => handleFieldChange(campo, e.target.value)}
                        disabled={!esEditableActual}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-business-mustard/10 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">Seleccione...</option>
                        {opciones.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                </div>
            );
        }

        const isNumber = typeof datos[campo] === 'number' || ['pesoBruto', 'pesoNeto', 'precioCompra', 'factorConversion', 'cantidadConvertida', 'precioPorUnidad', 'cantidadCompra'].includes(campo);
        
        if (campo === 'proveedor') {
            return (
                <div key={campo} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">{label}</label>
                    <input 
                        list="proveedores-datalist"
                        type="text" 
                        value={datos[campo] as any} 
                        onChange={e => handleFieldChange(campo, e.target.value)} 
                        disabled={!esEditableActual} 
                        placeholder="Escribe para buscar proveedor..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-business-mustard/10 transition-all disabled:bg-slate-50 disabled:text-slate-400" 
                    />
                    <datalist id="proveedores-datalist">
                        {proveedores.map((p, idx) => (
                            <option key={`${p.nombre}-${idx}`} value={p.nombre} />
                        ))}
                    </datalist>
                </div>
            );
        }

        return (
            <div key={campo} className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">{label}</label>
                <input type={isNumber ? "number" : "text"} value={datos[campo] as any} onChange={e => handleFieldChange(campo, isNumber ? parseFloat(e.target.value) : e.target.value)} disabled={!esEditableActual} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-business-mustard/10 transition-all disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-business-olive text-white rounded-xl shadow-lg shadow-business-olive/20"><Package className="w-6 h-6" /></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{datos.nombre || 'Nuevo Insumo'}</h2>
                            <p className="text-[9px] font-bold text-business-orange uppercase mt-0.5">ID: {datos.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex border-b overflow-x-auto bg-white px-2">
                    {fasesActivas.map((f, idx) => (
                        <button key={f.id} onClick={() => setFaseActivaId(f.id)} className={`px-5 py-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border-b-4 transition-all shrink-0 ${faseActivaId === f.id ? 'border-business-orange text-business-orange bg-business-mustard/5' : 'border-transparent text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${faseActivaId === f.id ? 'bg-business-orange text-white' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
                            {f.nombre}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {faseActual && (
                        <div className="space-y-6 animate-in slide-in-from-right-2 duration-300" key={faseActual.id}>
                            <div className="flex items-center gap-3 p-4 bg-business-beige/20 rounded-2xl border border-business-mustard/10">
                                <ShieldCheck className="w-5 h-5 text-business-olive" />
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Responsable: {faseActual.rolResponsable}</h3>
                                    <p className="text-[10px] font-medium text-business-olive">{esEditableActual ? "Permisos activos." : `Sólo ${faseActual.rolResponsable} o ADMIN.`}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{faseActual.campos.map(campo => renderCampo(campo))}</div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50/80 flex justify-end gap-3 rounded-b-[2rem]">
                    <button onClick={onClose} className="px-6 py-3 text-business-olive font-black uppercase text-[10px] rounded-xl hover:bg-business-beige transition-all">Descartar</button>
                    
                    {datos.estado !== EstadoInsumo.COMPLETADO && (
                        <button onClick={() => onSave(datos)} className="px-8 py-3 bg-slate-200 text-slate-700 font-black uppercase text-[10px] rounded-xl hover:bg-slate-300 transition-all flex items-center gap-2">
                            <Save className="w-3.5 h-3.5" /> Guardar Avance
                        </button>
                    )}

                    {datos.estado === EstadoInsumo.PENDIENTE_COMPRAS && (role === 'COMPRAS' || role === 'ADMIN' || role === 'CHEF') && (
                        <button 
                            onClick={() => {
                                if (!datos.nombre || !datos.marca || !datos.proveedor || !datos.precioCompra || !datos.unidad) {
                                    alert("Por favor complete nombre, marca, proveedor, precio y unidad antes de enviar a Calidad.");
                                    return;
                                }
                                onSave({ ...datos, estado: EstadoInsumo.PENDIENTE_CALIDAD });
                            }} 
                            className="px-8 py-3 bg-business-orange text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-business-orange/90 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> Completar Fase (A Calidad)
                        </button>
                    )}

                    {datos.estado === EstadoInsumo.PENDIENTE_CALIDAD && (role === 'CALIDAD' || role === 'ADMIN') && (
                        <button 
                            onClick={() => {
                                onSave({ ...datos, estado: EstadoInsumo.PENDIENTE_LOGISTICA });
                            }} 
                            className="px-8 py-3 bg-business-orange text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-business-orange/90 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> Completar Fase (A Logística)
                        </button>
                    )}

                    {datos.estado === EstadoInsumo.PENDIENTE_LOGISTICA && (role === 'LOGISTICA' || role === 'ADMIN') && (
                        <button 
                            onClick={() => {
                                onSave({ ...datos, estado: EstadoInsumo.COMPLETADO });
                            }} 
                            className="px-8 py-3 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> Finalizar Alta Insumo
                        </button>
                    )}

                    {datos.estado === EstadoInsumo.COMPLETADO && (
                        <button onClick={() => onSave(datos)} className="px-8 py-3 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Save className="w-3.5 h-3.5" /> Guardar Cambios
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
