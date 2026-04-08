import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Ocurrió un error');
            }
        } catch (err: any) {
            setError(`Error de conexión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-business-olive flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-500 relative">
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-slate-400 hover:text-business-orange transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto flex items-center justify-center mb-4 text-slate-400">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Recuperar Acceso</h3>
                    <p className="text-slate-500 text-[11px] font-medium mt-2 max-w-[250px] mx-auto">
                        Ingresa el correo asociado a tu cuenta para recibir un enlace seguro de recuperación.
                    </p>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-sm font-bold">
                            Si el correo está registrado, en breve explicaremos cómo restablecer tu contraseña.
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Volver al Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                    placeholder="correo@ejemplo.com"
                                    required
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
                            disabled={loading || !email}
                            className="w-full bg-business-orange text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-business-orange/90 transition-all shadow-lg shadow-business-orange/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar Enlace <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
