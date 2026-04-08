import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ChangePassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const usernameState = location.state?.username || '';
    
    // Redirect if accessed improperly without an assigned username
    useEffect(() => {
        if (!usernameState) navigate('/');
    }, [usernameState, navigate]);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return setError('Las nuevas contraseñas no coinciden');
        }
        if (newPassword.length < 6) {
            return setError('La contraseña requiere al menos 6 caracteres');
        }
        if (currentPassword === newPassword) {
            return setError('La nueva contraseña debe ser diferente a la temporal');
        }
        
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: usernameState, 
                    currentPassword, 
                    newPassword 
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                // Return to login screen so they sign in cleanly with new password
                navigate('/', { replace: true, state: { successMsg: "¡Seguridad actualizada! Inicia sesión con tu nueva clave." }});
            } else {
                setError(data.error || 'Credenciales temporales inválidas');
            }
        } catch (err: any) {
            setError(`Error de conexión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-business-olive flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-500">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 mb-6">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-xs font-bold leading-relaxed">
                        Por motivos de seguridad, es obligatorio que cambies la contraseña temporal asignada ({usernameState}) antes de ingresar al sistema.
                    </p>
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">Actualizar Credenciales</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Contraseña Actual / Temporal</label>
                        <div className="relative group">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Nueva Contraseña Segura</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Confirmar Nueva Contraseña</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Validar y Actualizar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full text-slate-400 text-xs font-bold uppercase hover:text-slate-600 mt-2"
                    >
                        Cancelar y Volver
                    </button>
                </form>
            </div>
        </div>
    );
}
