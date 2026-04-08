import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError('Enlace inválido o expirado. Vuelve a solicitar la recuperación.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setError('Las contraseñas no coinciden');
        }
        if (newPassword.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres');
        }
        
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Token inválido o expirado');
            }
        } catch (err: any) {
            setError(`Error de conexión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-business-olive flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">¡Contraseña Actualizada!</h3>
                    <p className="text-slate-500 text-sm font-medium">Tu cuenta ha sido protegida. Ahora puedes iniciar sesión con tus nuevas credenciales.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-business-olive flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl mx-auto flex items-center justify-center mb-4 text-indigo-500">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Nueva Contraseña</h3>
                    <p className="text-slate-500 text-xs font-medium mt-2">
                        Crea una contraseña segura para restablecer tu acceso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Nueva Contraseña</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                placeholder="Min. 6 caracteres"
                                required
                                disabled={!token}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Confirmar Contraseña</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                placeholder="Repite la contraseña"
                                required
                                disabled={!token}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600">
                            <span className="text-xs font-bold">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-business-orange text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-business-orange/90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Guardar y Entrar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    
                    {!token && (
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors mt-4"
                        >
                            Solicitar nuevo enlace
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
