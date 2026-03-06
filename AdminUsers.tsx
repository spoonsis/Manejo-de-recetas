import React, { useState } from 'react';
import { Usuario, Rol } from './types';
import {
    Users, Plus, Search, Edit3, Trash2, ShieldCheck,
    CheckCircle2, XCircle, Key, Save, X
} from 'lucide-react';

interface AdminUsersProps {
    usuarios: Usuario[];
    setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
    rolesDisponibles: string[]; // Simplificado de Rol[]
}

export default function AdminUsers({ usuarios, setUsuarios, rolesDisponibles }: AdminUsersProps) {
    const [busqueda, setBusqueda] = useState('');
    const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.rol.toLowerCase().includes(busqueda.toLowerCase())
    );

    const manejarGuardar = (usuario: Usuario) => {
        setUsuarios(prev => {
            const existe = prev.find(u => u.id === usuario.id);
            if (existe) {
                return prev.map(u => u.id === usuario.id ? usuario : u);
            }
            return [...prev, usuario];
        });
        setEditandoUsuario(null);
    };

    const manejarEliminar = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            setUsuarios(prev => prev.filter(u => u.id !== id));
        }
    };

    const manejarCrearNuevo = () => {
        setEditandoUsuario({
            id: Math.random().toString(36).substr(2, 9),
            nombreUsuario: '',
            email: '',
            nombreCompleto: '',
            rol: 'CHEF',
            activo: true,
            avatar: `https://ui-avatars.com/api/?name=Nuevo+Usuario&background=random`
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Directorio de Usuarios
                    </h2>
                    <p className="text-slate-500 font-medium">Gestiona el acceso y los roles del personal.</p>
                </div>
                <button
                    onClick={manejarCrearNuevo}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Registrar Usuario
                </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o rol..."
                    className="flex-1 outline-none font-medium text-slate-700 placeholder:text-slate-300"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {/* Grid de Usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuariosFiltrados.map(usuario => (
                    <div key={usuario.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={usuario.avatar || `https://ui-avatars.com/api/?name=${usuario.nombreCompleto}&background=random`}
                                    alt={usuario.nombreCompleto}
                                    className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                                />
                                <div>
                                    <h3 className="font-black text-slate-900 leading-tight">{usuario.nombreCompleto}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">@{usuario.nombreUsuario}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${usuario.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {usuario.activo ? 'Activo' : 'Inactivo'}
                            </div>
                        </div>

                        <div className="space-y-3 pl-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">{usuario.rol}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <span className="text-slate-300">Email:</span> {usuario.email}
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => setEditandoUsuario(usuario)}
                                className="p-2 bg-white text-indigo-600 rounded-xl shadow-lg border border-slate-100 hover:bg-slate-50"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            {usuario.rol !== 'ADMIN' && (
                                <button
                                    onClick={() => manejarEliminar(usuario.id)}
                                    className="p-2 bg-white text-rose-500 rounded-xl shadow-lg border border-slate-100 hover:bg-rose-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Editor Usuario */}
            {editandoUsuario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">
                                        {editandoUsuario.id ? 'Editar Perfil' : 'Nuevo Usuario'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credenciales y Acceso</p>
                                </div>
                            </div>
                            <button onClick={() => setEditandoUsuario(null)} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</label>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editandoUsuario.nombreCompleto}
                                        onChange={e => setEditandoUsuario({ ...editandoUsuario, nombreCompleto: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre de Usuario</label>
                                    <input
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editandoUsuario.nombreUsuario}
                                        onChange={e => setEditandoUsuario({ ...editandoUsuario, nombreUsuario: e.target.value })}
                                        placeholder="Ej. jperez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editandoUsuario.email}
                                        onChange={e => setEditandoUsuario({ ...editandoUsuario, email: e.target.value })}
                                        placeholder="Ej. juan@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rol de Sistema</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={editandoUsuario.rol}
                                        onChange={e => setEditandoUsuario({ ...editandoUsuario, rol: e.target.value })}
                                    >
                                        {rolesDisponibles.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                                <Key className="w-5 h-5 text-amber-500 mt-1" />
                                <div>
                                    <h5 className="font-bold text-amber-800 text-sm">Restablecer Contraseña</h5>
                                    <p className="text-xs text-amber-600 mt-1 mb-3">Deja este campo vacío para mantener la contraseña actual.</p>
                                    <input
                                        type="password"
                                        className="w-full p-3 bg-white border border-amber-200 rounded-xl text-sm font-bold outline-none focus:border-amber-400"
                                        placeholder="Nueva contraseña..."
                                        onChange={e => {
                                            if (e.target.value) setEditandoUsuario({ ...editandoUsuario, passwordHash: 'HASH_UPDATED' })
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-14 h-8 rounded-full relative transition-colors ${editandoUsuario.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${editandoUsuario.activo ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <span className="font-bold text-sm text-slate-600 group-hover:text-slate-900">
                                        {editandoUsuario.activo ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                                    </span>
                                </label>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={editandoUsuario.activo}
                                    onChange={e => setEditandoUsuario({ ...editandoUsuario, activo: e.target.checked })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditandoUsuario(null)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => manejarGuardar(editandoUsuario)}
                                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Guardar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

