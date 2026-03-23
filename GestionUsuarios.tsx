import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Mail, 
    Shield, 
    Lock, 
    Trash2, 
    UserCheck, 
    UserX, 
    Search,
    Loader2,
    Plus,
    X,
    Save
} from 'lucide-react';
import { Usuario, Rol } from './types';
import { useStore } from './useStore';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';

export default function GestionUsuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // New user form state
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        nombreCompleto: '',
        rol: 'CHEF' as Rol
    });


    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/usuarios`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
                credentials: 'include'
            });

            if (res.ok) {
                setShowAddModal(false);
                setNewUser({ username: '', email: '', password: '', nombreCompleto: '', rol: 'CHEF' });
                fetchUsuarios();
            } else {
                const err = await res.json();
                alert(err.error || "Error al crear usuario");
            }
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };

    const toggleUserStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/usuarios/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                fetchUsuarios();
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const filteredUsers = usuarios.filter(u => 
        u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles: Rol[] = ['CHEF', 'COSTOS', 'MKT', 'CALIDAD', 'COMPRAS', 'LOGISTICA', 'ADMIN'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-business-orange" />
                        Control de Acceso y Usuarios
                    </h2>
                    <p className="text-slate-500 font-medium text-[11px] mt-0.5">Gestiona los permisos y el personal con acceso al sistema.</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
                    <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Buscar por nombre, usuario o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none font-medium text-xs transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Último Acceso</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-business-orange mx-auto mb-2" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Personal...</span>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic text-sm">
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-business-beige flex items-center justify-center text-business-orange font-black text-sm border-2 border-white shadow-sm">
                                                {u.nombreCompleto.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 text-sm leading-tight">{u.nombreCompleto}</div>
                                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="w-2.5 h-2.5" /> {u.email}
                                                    <span className="text-slate-200">|</span>
                                                    <span className="lowercase">@{u.nombreUsuario}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-wider text-slate-600">
                                            <Shield className="w-3.5 h-3.5 text-business-orange/60" />
                                            {u.rol}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={u.activo ? 'success' : 'neutral'}>
                                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                            {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString() : 'NUNCA'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => toggleUserStatus(u.id)}
                                            title={u.activo ? "Inactivar Usuario" : "Activar Usuario"}
                                            className={`p-2 rounded-lg transition-all ${u.activo ? 'text-slate-300 hover:text-rose-500 hover:bg-rose-50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                        >
                                            {u.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">Registrar Nuevo Usuario</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">GastroFlow Pro Security</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors group">
                                <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario (ID)</label>
                                    <input 
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none transition-all"
                                        placeholder="ej. agarcia"
                                        value={newUser.username}
                                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol del Sistema</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none appearance-none"
                                        value={newUser.rol}
                                        onChange={e => setNewUser({...newUser, rol: e.target.value as Rol})}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input 
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none transition-all"
                                    placeholder="ej. Antonio García"
                                    value={newUser.nombreCompleto}
                                    onChange={e => setNewUser({...newUser, nombreCompleto: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none transition-all"
                                        placeholder="ej. agarcia@restaurante.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Temporal</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input 
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-business-mustard/20 focus:border-business-orange outline-none transition-all"
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-2xl py-6" onClick={() => setShowAddModal(false)}>
                                    Cancelar
                                </Button>
                                <Button className="flex-1 bg-business-orange text-white rounded-2xl py-6 shadow-xl shadow-business-orange/20">
                                    <Save className="w-4 h-4 mr-2" /> Crear Acceso
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
