import React, { useState } from 'react';
import { Utensils, Lock, User, ArrowRight, Loader2, ChefHat, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Usuario } from './types';

interface LoginProps {
    onLogin: (usuario: Usuario) => void;
    usuariosRegistrados: Usuario[];
}

export default function Login({ onLogin }: { onLogin: (usuario: Usuario) => void }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const resetPassword = async () => {
        try {
            const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

            const res = await fetch(`/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    newPassword: password
                })
            });

            const data = await res.json();
            console.log("RESET:", data);

            if (data.success) {
                alert("✅ Contraseña actualizada. Ahora intenta ingresar.");
            } else {
                alert(data.error || "Error en reset");
            }

        } catch (err) {
            console.error(err);
            alert("Error de conexión en reset");
        }
    };
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
            const apiUrl = `/api/auth/login`;

            console.log("Intentando login en:", apiUrl);

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                if (data.error === "PASSWORD_CHANGE_REQUIRED") {
                    navigate('/change-password', { state: { username } });
                } else {
                    onLogin(data.user);
                }
            } else {
                const errData = await res.json();
                setError(errData.error || 'Credenciales inválidas');
            }
        } catch (err: any) {
            console.error("DETALLE ERROR LOGIN:", {
                mensaje: err.message,
                causa: err.cause,
                stack: err.stack,
                type: typeof err
            });
            setError(`Error de conexión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-business-olive flex items-center justify-center p-4">

            {/* Tarjeta de Login Centrada */}
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-business-orange rounded-xl mx-auto flex items-center justify-center mb-4 text-white shadow-lg shadow-business-orange/20">
                        <ChefHat className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Bienvenido</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">Ingresa a Maestro de Recetas</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Usuario</label>
                        <div className="relative group">
                            <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                placeholder="ej. admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-business-orange transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-business-mustard/20 focus:border-business-orange transition-all"
                                placeholder="*******"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 animate-pulse">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-bold">{error}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-business-orange focus:ring-business-mustard/20" />
                            <span className="text-xs font-bold text-slate-500">Recordarme</span>
                        </label>
                        <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-bold text-business-orange hover:text-business-olive bg-transparent border-none">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-business-orange text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-business-orange/90 transition-all shadow-lg shadow-business-orange/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ingresar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>

                <p className="text-center text-[10px] text-slate-400 font-medium mt-8">
                    &copy; 2026 GastroFlow Pro
                </p>
            </div>
        </div>

    );
}

function ShieldAlert(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}
