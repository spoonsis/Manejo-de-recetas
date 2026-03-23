import React, { useState } from 'react';
import {
    Settings2,
    ShieldAlert,
    Plus,
    Users,
    Key,
    Trash2,
    ArrowRight,
    ToggleRight,
    Edit3,
    Save,
    X,
    ChevronUp,
    ChevronDown,
    CheckCircle2
} from 'lucide-react';
import {
    ConfiguracionRol,
    Permiso,
    FlujoAprobacion,
    PasoFlujo,
    Rol,
    EstadoReceta,
    FaseFluxoInsumo,
    Insumo
} from './types';

const PERMISOS_DISPONIBLES: Permiso[] = [
    'RECETAS_LECTURA', 'RECETAS_ESCRITURA', 'APROBAR_COSTOS',
    'APROBAR_MKT', 'CERTIFICAR_CALIDAD', 'GESTION_INSUMOS',
    'CONFIG_SISTEMA', 'GESTION_USUARIOS', 'FICHAS_TECNICAS'
];

interface AdminWorkflowsProps {
    configRoles: ConfiguracionRol[];
    setConfigRoles: React.Dispatch<React.SetStateAction<ConfiguracionRol[]>>;
    flujos: FlujoAprobacion[];
    setFlujos: React.Dispatch<React.SetStateAction<FlujoAprobacion[]>>;
    fasesInsumo: FaseFluxoInsumo[];
    setFasesInsumo: React.Dispatch<React.SetStateAction<FaseFluxoInsumo[]>>;
    onSaveFlujo: (flujo: FlujoAprobacion) => Promise<void>;
    onDeleteFlujo: (id: string) => Promise<void>;
}

export default function AdminWorkflows({ 
    configRoles, 
    setConfigRoles, 
    flujos, 
    setFlujos, 
    fasesInsumo, 
    setFasesInsumo,
    onSaveFlujo,
    onDeleteFlujo
}: AdminWorkflowsProps) {
    const [tab, setTab] = useState<'roles' | 'flujos' | 'insumos'>('flujos');
    const [editandoFlujo, setEditandoFlujo] = useState<FlujoAprobacion | null>(null);
    const [editandoFase, setEditandoFase] = useState<FaseFluxoInsumo | null>(null);

    const alternarPermiso = (rolName: string, permiso: Permiso) => {
        setConfigRoles((prev) => prev.map(cr => {
            if (cr.rol !== rolName) return cr;
            const tienePermiso = cr.permisos.includes(permiso);
            const nuevosPermisos = tienePermiso
                ? cr.permisos.filter(p => p !== permiso)
                : [...cr.permisos, permiso];
            return { ...cr, permisos: nuevosPermisos };
        }));
    };

    // --- Flujos Aprobación Handlers ---
    const guardarFlujo = (flujo: FlujoAprobacion) => {
        onSaveFlujo(flujo);
        setEditandoFlujo(null);
    };

    const eliminarFlujo = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este flujo?')) {
            onDeleteFlujo(id);
        }
    };

    const toggleActivo = (id: string) => {
        setFlujos(prev => prev.map(f => {
            if (f.id === id) return { ...f, activo: !f.activo };
            return f;
        }));
    };

    // --- Fases Insumo Handlers ---
    const guardarFase = (fase: FaseFluxoInsumo) => {
        setFasesInsumo(prev => {
            const existe = prev.find(f => f.id === fase.id);
            if (existe) return prev.map(f => f.id === fase.id ? fase : f);
            return [...prev, fase];
        });
        setEditandoFase(null);
    };

    const eliminarFase = (id: string) => {
        if (confirm('¿Eliminar fase?')) {
            setFasesInsumo(prev => prev.filter(f => f.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings2 className="w-8 h-8 text-business-orange" />
                        Configuración del Sistema
                    </h1>
                    <p className="text-slate-500 font-medium text-xs mt-1 italic">Define la arquitectura operativa y de seguridad del sistema.</p>
                </div>
            </header>

            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setTab('roles')}
                    className={`px-6 py-3 font-black uppercase text-[10px] tracking-widest border-b-4 transition-all ${tab === 'roles' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-400'}`}
                >
                    Roles y Privilegios
                </button>
                <button
                    onClick={() => setTab('flujos')}
                    className={`px-6 py-3 font-black uppercase text-[10px] tracking-widest border-b-4 transition-all ${tab === 'flujos' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-400'}`}
                >
                    Flujos Aprobación
                </button>
                <button
                    onClick={() => setTab('insumos')}
                    className={`px-6 py-3 font-black uppercase text-[10px] tracking-widest border-b-4 transition-all ${tab === 'insumos' ? 'border-business-orange text-business-orange' : 'border-transparent text-slate-400'}`}
                >
                    Flujos Insumos
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                {/* --- TAB ROLES --- */}
                {tab === 'roles' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase">Gestión de Roles</h2>
                                <p className="text-slate-500 font-medium italic text-[10px]">Define los perfiles de acceso.</p>
                            </div>
                            <button
                                onClick={() => {
                                    const nombre = prompt('Nombre del nuevo rol (ej. SUPERVISOR):')?.toUpperCase();
                                    if (nombre) {
                                        if (configRoles.some(r => r.rol === nombre)) {
                                            alert('Este rol ya existe.');
                                            return;
                                        }
                                        const colores = ['bg-indigo-600', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-violet-600', 'bg-cyan-500'];
                                        const color = colores[Math.floor(Math.random() * colores.length)];
                                        setConfigRoles(prev => [...prev, { rol: nombre, permisos: [], color }]);
                                    }
                                }}
                                className="bg-business-orange text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-business-orange/90 transition"
                            >
                                <Plus className="w-3.5 h-3.5" /> Nuevo Rol
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {configRoles.map((cr) => (
                                <div key={cr.rol} className="border rounded-2xl p-5 space-y-4 bg-slate-50/30 relative group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${cr.color} flex items-center justify-center text-white shadow-lg`}>
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{cr.rol}</h3>
                                                {cr.rol === 'ADMIN' && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema</span>}
                                            </div>
                                        </div>
                                        {cr.rol !== 'ADMIN' && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`¿Eliminar el rol ${cr.rol}? Esto podría afectar usuarios asignados.`)) {
                                                        setConfigRoles(prev => prev.filter(r => r.rol !== cr.rol));
                                                    }
                                                }}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm max-h-60 overflow-y-auto inner-scroll">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-3 sticky top-0 bg-white pb-2 border-b border-slate-50">Permisos Asignados:</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {PERMISOS_DISPONIBLES.map(p => {
                                                const activo = cr.permisos.includes(p);
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => alternarPermiso(cr.rol, p)}
                                                        className={`flex items-center justify-between p-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider ${activo ? 'bg-business-mustard/10 text-business-orange' : 'text-slate-400 hover:bg-slate-50'}`}
                                                    >
                                                        <span>{p.replace(/_/g, ' ')}</span>
                                                        {activo && <CheckCircle2 className="w-3 h-3 text-business-orange" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'flujos' && (
                    <>
                        {editandoFlujo ? (
                            <EditorFlujo
                                flujo={editandoFlujo}
                                onSave={guardarFlujo}
                                onCancel={() => setEditandoFlujo(null)}
                            />
                        ) : (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 uppercase">Flujos de Aprobación</h2>
                                        <p className="text-slate-500 font-medium italic text-[10px]">Configura las etapas de revisión.</p>
                                    </div>
                                    <button
                                        onClick={() => setEditandoFlujo({
                                            id: Math.random().toString(36).substr(2, 9),
                                            nombre: 'Nuevo Flujo',
                                            descripcion: '',
                                            activo: false,
                                            pasos: []
                                        })}
                                        className="bg-business-orange text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-business-orange/90 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Nuevo Flujo
                                    </button>
                                </div>
                                {flujos.map((f) => (
                                    <div key={f.id} className={`border rounded-2xl p-5 space-y-5 transition-all ${f.activo ? 'border-business-mustard/20 bg-business-mustard/5' : 'border-slate-100 bg-slate-50 opactiy-75'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{f.nombre}</h3>
                                                    {f.activo ? (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVO
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full">INACTIVO</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 font-medium text-[11px] italic">{f.descripcion}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleActivo(f.id)}
                                                    className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider border ${f.activo ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    {f.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button
                                                    onClick={() => setEditandoFlujo(f)}
                                                    className="p-2 bg-white text-business-orange rounded-lg shadow-sm border border-slate-100 hover:border-business-mustard/50"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => eliminarFlujo(f.id)}
                                                    className="p-2 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-100 hover:border-rose-200"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 overflow-x-auto pb-4 inner-scroll">
                                            {f.pasos.sort((a, b) => a.orden - b.orden).map((p, idx) => (
                                                <React.Fragment key={p.id}>
                                                    <div className="min-w-[220px] bg-white border border-slate-100 rounded-xl p-4 relative shadow-sm">
                                                        <div className="absolute -top-3 -left-3 w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md">
                                                            {p.orden}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3 mt-1">
                                                            <div className="p-2 bg-business-mustard/10 rounded-lg text-business-orange">
                                                                <Users className="w-3.5 h-3.5" />
                                                            </div>
                                                            <h4 className="font-black text-slate-900 uppercase text-[9px] tracking-widest truncate" title={p.etiqueta}>
                                                                {p.etiqueta}
                                                            </h4>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                Responsable: <span className="text-business-orange">{p.rolResponsable}</span>
                                                            </p>
                                                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                                                <Key className="w-2.5 h-2.5" /> {p.accionRequerida.replace('_', ' ')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {idx < f.pasos.length - 1 && <ArrowRight className="text-slate-200 shrink-0 w-4 h-4" />}
                                                </React.Fragment>
                                            ))}
                                            {f.pasos.length === 0 && (
                                                <div className="text-slate-400 italic font-medium text-[10px] p-2">Sin pasos definidos.</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === 'insumos' && (
                    <>
                        {editandoFase ? (
                            <EditorFaseInsumo
                                fase={editandoFase}
                                onSave={guardarFase}
                                onCancel={() => setEditandoFase(null)}
                            />
                        ) : (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 uppercase">Ciclo de Insumos</h2>
                                        <p className="text-slate-500 font-medium italic text-[10px]">Define las fases de registro.</p>
                                    </div>
                                    <button
                                        onClick={() => setEditandoFase({
                                            id: Math.random().toString(36).substr(2, 9),
                                            nombre: 'Nueva Fase',
                                            orden: fasesInsumo.length + 1,
                                            rolResponsable: 'CHEF',
                                            campos: [],
                                            activo: true
                                        })}
                                        className="bg-business-orange text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-business-orange/90 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Nueva Fase
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {fasesInsumo.sort((a, b) => a.orden - b.orden).map(f => (
                                        <div key={f.id} className={`p-4 border rounded-2xl flex items-center gap-4 ${f.activo ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                                            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base shadow-md shrink-0">
                                                {f.orden}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-black text-slate-900">{f.nombre}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] font-black uppercase text-business-orange bg-business-mustard/10 px-2.5 py-0.5 rounded-full">
                                                        Rol: {f.rolResponsable}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                        {f.campos.length} Campos
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => guardarFase({ ...f, activo: !f.activo })} className={`p-2 rounded-lg border ${f.activo ? 'text-emerald-600 border-emerald-100 hover:bg-emerald-50' : 'text-slate-400 border-slate-200 bg-white'}`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditandoFase(f)} className="p-2 bg-white text-business-orange rounded-lg shadow-sm border border-slate-100 hover:border-business-mustard/50">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => eliminarFase(f.id)} className="p-2 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-100 hover:border-rose-200">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {fasesInsumo.length === 0 && (
                                        <div className="text-center p-8 text-slate-400 text-[11px] font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                                            Sin fases definidas.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// --- Subcomponente Editor Flujo (Aprobación) ---

function EditorFlujo({ flujo, onSave, onCancel }: { flujo: FlujoAprobacion, onSave: (f: FlujoAprobacion) => void, onCancel: () => void }) {
    const [datos, setDatos] = useState<FlujoAprobacion>(flujo);

    const agregarPaso = () => {
        const nuevoPaso: PasoFlujo = {
            id: Math.random().toString(36).substr(2, 9),
            orden: datos.pasos.length + 1,
            rolResponsable: 'CHEF',
            accionRequerida: 'FIRMA_SIMPLE',
            estadoDestino: EstadoReceta.APROBADO,
            etiqueta: 'Nueva Aprobación'
        };
        setDatos({ ...datos, pasos: [...datos.pasos, nuevoPaso] });
    };

    const eliminarPaso = (id: string) => {
        const nuevosPasos = datos.pasos.filter(p => p.id !== id).map((p, idx) => ({ ...p, orden: idx + 1 }));
        setDatos({ ...datos, pasos: nuevosPasos });
    };

    const moverPaso = (index: number, direccion: 'subir' | 'bajar') => {
        if (direccion === 'subir' && index === 0) return;
        if (direccion === 'bajar' && index === datos.pasos.length - 1) return;

        const nuevosPasos = [...datos.pasos];
        const temp = nuevosPasos[index];
        const nuevoIndex = direccion === 'subir' ? index - 1 : index + 1;

        nuevosPasos[index] = nuevosPasos[nuevoIndex];
        nuevosPasos[nuevoIndex] = temp;

        // Recalcular orden
        const pasosReordenados = nuevosPasos.map((p, idx) => ({ ...p, orden: idx + 1 }));
        setDatos({ ...datos, pasos: pasosReordenados });
    };

    const actualizarPaso = (id: string, campo: keyof PasoFlujo, valor: any) => {
        setDatos({
            ...datos,
            pasos: datos.pasos.map(p => p.id === id ? { ...p, [campo]: valor } : p)
        });
    };

    // Roles y Estados disponibles para selects
    const rolesDisponibles: Rol[] = ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'COMPRAS', 'LOGISTICA', 'ADMIN'];
    const estadosDisponibles = Object.values(EstadoReceta);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-black text-slate-900 uppercase">
                    {flujo.id ? 'Editar Flujo' : 'Crear Flujo'}
                </h3>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold text-slate-500 text-[10px] uppercase hover:bg-slate-100 transition">
                        Cancelar
                    </button>
                    <button onClick={() => onSave(datos)} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2">
                        <Save className="w-3.5 h-3.5" /> Guardar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nombre del Flujo</label>
                    <input
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-business-mustard/50 outline-none transition"
                        value={datos.nombre}
                        onChange={e => setDatos({ ...datos, nombre: e.target.value })}
                        placeholder="Ej. Flujo Estándar..."
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Descripción Breve</label>
                    <input
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs focus:ring-2 focus:ring-business-mustard/50 outline-none transition"
                        value={datos.descripcion}
                        onChange={e => setDatos({ ...datos, descripcion: e.target.value })}
                        placeholder="Ej. Validación técnica y comercial..."
                    />
                </div>
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={() => setDatos({ ...datos, activo: !datos.activo })}
                        className={`w-10 h-6 rounded-full relative transition-colors ${datos.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${datos.activo ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                    <span className="font-bold text-[10px] text-slate-600 uppercase">
                        {datos.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </div>

            <div className="mt-10">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-business-orange" />
                        Secuencia de Aprobación
                    </h4>
                    <button
                        onClick={agregarPaso}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition"
                    >
                        <Plus className="w-4 h-4" /> Agregar Paso
                    </button>
                </div>

                <div className="space-y-4">
                    {datos.pasos.sort((a, b) => a.orden - b.orden).map((paso, index) => (
                        <div key={paso.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex gap-6 items-start group hover:border-business-mustard/50 transition-colors">
                            <div className="flex flex-col gap-1 items-center justify-center pt-2">
                                <button
                                    onClick={() => moverPaso(index, 'subir')}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-business-orange disabled:opacity-30"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                                <div className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white font-black rounded-lg text-sm">
                                    {paso.orden}
                                </div>
                                <button
                                    onClick={() => moverPaso(index, 'bajar')}
                                    disabled={index === datos.pasos.length - 1}
                                    className="p-1 text-slate-400 hover:text-business-orange disabled:opacity-30"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Etiqueta del Paso</label>
                                    <input
                                        value={paso.etiqueta}
                                        onChange={e => actualizarPaso(paso.id, 'etiqueta', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm font-bold"
                                        placeholder="Ej. Revisión Calidad"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Rol Responsable</label>
                                    <select
                                        value={paso.rolResponsable}
                                        onChange={e => actualizarPaso(paso.id, 'rolResponsable', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm font-medium bg-white"
                                    >
                                        {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Acción Requerida</label>
                                    <select
                                        value={paso.accionRequerida}
                                        onChange={e => actualizarPaso(paso.id, 'accionRequerida', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm font-medium bg-white"
                                    >
                                        <option value="FIRMA_SIMPLE">Firma Simple</option>
                                        <option value="CODIGO_QC">Código de Calidad (QC)</option>
                                        <option value="VALIDACION_COSTOS">Validación Costos</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Estado Destino (Al Aprobar)</label>
                                    <select
                                        value={paso.estadoDestino}
                                        onChange={e => actualizarPaso(paso.id, 'estadoDestino', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm font-medium bg-white"
                                    >
                                        {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => eliminarPaso(paso.id)}
                                className="p-3 bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-50 transition self-center"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {datos.pasos.length === 0 && (
                        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
                            No hay pasos definidos en este flujo. Agrega uno para comenzar.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Subcomponente Editor Fase Insumo ---

function EditorFaseInsumo({ fase, onSave, onCancel }: { fase: FaseFluxoInsumo, onSave: (f: FaseFluxoInsumo) => void, onCancel: () => void }) {
    const [datos, setDatos] = useState<FaseFluxoInsumo>(fase);

    const todosCampos: (keyof Insumo)[] = [
        'nombre', 'tipoMaterial', 'unidad', 'unidadStock', 'pesoBruto', 'pesoNeto', 'precioCompra',
        'tipoImpuesto', 'proveedor', 'codigoBarras', 'locales', 'documentos',
        'lote', 'alergenos', 'descripcionAlergenos',
        'tipoAlmacenamiento', 'seccionAlisto', 'clasificacion',
        'unidadConsumo', 'factorConversion', 'cantidadConvertida', 'cantidadCompra'
    ];

    const rolesDisponibles: Rol[] = ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'COMPRAS', 'LOGISTICA', 'ADMIN'];

    const toggleCampo = (campo: keyof Insumo) => {
        setDatos(prev => {
            const existe = prev.campos.includes(campo);
            return {
                ...prev,
                campos: existe ? prev.campos.filter(c => c !== campo) : [...prev.campos, campo]
            };
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-black text-slate-900 uppercase">
                    {fase.id ? 'Editar Fase' : 'Nueva Fase'}
                </h3>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold text-slate-500 text-[10px] uppercase hover:bg-slate-100 transition">
                        Cancelar
                    </button>
                    <button onClick={() => onSave(datos)} className="px-5 py-2 rounded-xl bg-business-orange text-white font-bold text-[10px] uppercase shadow-lg shadow-business-orange/20 hover:bg-business-orange/90 transition flex items-center gap-2">
                        <Save className="w-3.5 h-3.5" /> Guardar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nombre de la Fase</label>
                    <input
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-business-mustard/50 outline-none"
                        value={datos.nombre}
                        onChange={e => setDatos({ ...datos, nombre: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Orden</label>
                    <input
                        type="number"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-business-mustard/50 outline-none"
                        value={datos.orden}
                        onChange={e => setDatos({ ...datos, orden: parseInt(e.target.value) })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Responsable</label>
                    <select
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-business-mustard/50 outline-none"
                        value={datos.rolResponsable}
                        onChange={e => setDatos({ ...datos, rolResponsable: e.target.value as Rol })}
                    >
                        {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            <div className="pt-4">
                <h4 className="text-sm font-black text-slate-900 uppercase mb-3">Campos Asignados</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {todosCampos.map(campo => {
                        const asignado = datos.campos.includes(campo);
                        return (
                            <button
                                key={campo}
                                onClick={() => toggleCampo(campo)}
                                className={`p-3 rounded-xl text-left border transition-all ${asignado ? 'border-business-orange bg-business-mustard/10 text-business-orange' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[9px] uppercase">{campo}</span>
                                    {asignado && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
