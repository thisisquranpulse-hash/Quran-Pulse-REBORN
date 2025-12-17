import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';

interface LoginProps {
    onGuestLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGuestLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    
    const redirectUrl = window.location.origin;

    try {
      const { data, error } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      if (data?.url) {
          window.location.href = data.url;
      }

    } catch (error: any) {
      console.error("Google Login Error:", error);
      
      // Friendly Error Parsing with Specific Fix Instructions
      let errorMsg = error.message || "Ralat tidak diketahui.";
      let extraHelp = "";

      if (errorMsg.includes("Redirect URL") || errorMsg.includes("mismatch")) {
          errorMsg = "Pautan URL tidak dibenarkan oleh pelayan.";
          extraHelp = "Sila gunakan 'Teruskan sebagai Tetamu' jika anda sedang menggunakan persekitaran Preview/Localhost.";
      }
      
      setMessage({ 
          type: 'error', 
          text: `${errorMsg} ${extraHelp}`
      });
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
            throw new Error("Kata laluan tidak sepadan.");
        }
        if (!fullName.trim()) {
            throw new Error("Sila masukkan nama penuh anda.");
        }

        const { error, data } = await (supabase.auth as any).signUp({
          email,
          password,
          options: {
            data: {
                full_name: fullName
            }
          }
        });
        if (error) throw error;
        if (data.user && !data.session) {
             setMessage({ type: 'success', text: 'Pendaftaran berjaya! Sila semak emel anda untuk pengesahan.' });
             setLoading(false);
             return;
        }
      } else {
        const { error } = await (supabase.auth as any).signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-dark relative overflow-hidden font-display text-white selection:bg-primary selection:text-background-dark">
      
      {/* 3-Tone Ambient Background (Blue/Cyan) */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/40 blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-4">
        {/* Glass Card - Deep Blue Style */}
        <div className="bg-surface-dark/60 backdrop-blur-[40px] border border-white/10 rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300">
            
            {/* Top Row: Title & Toggle */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        {isSignUp ? 'Daftar' : 'Log Masuk'}
                    </h1>
                    <p className="text-primary text-[10px] font-mono tracking-widest uppercase">NurQuran Pulse</p>
                </div>
                <button 
                    onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                >
                    {isSignUp ? 'Sudah ada akaun?' : 'Tiada akaun?'}
                </button>
            </div>

            {/* Logo Watermark */}
            <div className="absolute -right-6 top-12 opacity-10 pointer-events-none">
                 <Logo className="w-40 h-40" />
            </div>

            {/* Messages */}
            {message && (
                <div className={`w-full mb-6 p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in-95 leading-relaxed shadow-lg break-words ${message.type === 'error' ? 'bg-red-500/20 text-red-100 border border-red-500/50' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                    {message.text}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4 relative z-10">
                
                {/* Full Name - Sign Up Only */}
                {isSignUp && (
                    <div className="group animate-in slide-in-from-left duration-300 fade-in">
                        <input 
                            type="text" 
                            placeholder="Nama Penuh"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                        />
                    </div>
                )}

                <div className="group">
                    <input 
                        type="email" 
                        placeholder="Alamat Emel"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                    />
                </div>
                
                <div className="group relative">
                    <input 
                        type="password" 
                        placeholder="Kata Laluan"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                    />
                    {!isSignUp && (
                        <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-primary transition-colors">
                            Lupa?
                        </button>
                    )}
                </div>

                {/* Confirm Password - Sign Up Only */}
                {isSignUp && (
                    <div className="group animate-in slide-in-from-left duration-300 fade-in delay-75">
                        <input 
                            type="password" 
                            placeholder="Sahkan Kata Laluan"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                        />
                    </div>
                )}

                {/* Remember Me - Login Only */}
                {!isSignUp && (
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div 
                            onClick={() => setRememberMe(!rememberMe)}
                            className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${rememberMe ? 'bg-primary' : 'bg-background-dark border border-white/10'}`}
                        >
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${rememberMe ? 'translate-x-5' : 'translate-x-0 bg-slate-500'}`}></div>
                        </div>
                        <span className="text-xs text-slate-400 select-none">Ingat saya</span>
                    </div>
                )}

                {/* Submit Action - Cyan Pill Button */}
                <div className="pt-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-500 leading-tight max-w-[150px]">
                        Dengan meneruskan, anda bersetuju dengan Terma Perkhidmatan kami.
                    </p>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-14 w-24 bg-primary text-background-dark rounded-full flex items-center justify-center hover:scale-105 hover:shadow-neon transition-all shadow-lg disabled:opacity-50 group"
                    >
                        {loading ? (
                             <div className="w-5 h-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        )}
                    </button>
                </div>
            </form>

            {/* Social Divider */}
            <div className="mt-8 mb-4 flex items-center gap-4">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[10px] text-slate-500 uppercase">Atau teruskan dengan</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            <div className="space-y-3">
                {/* Google Pill */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-surface-card hover:bg-surface-hover border border-white/5 rounded-full py-3 flex items-center justify-center gap-3 transition-colors group"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white">Google</span>
                </button>

                {/* GUEST MODE BUTTON */}
                <button
                    onClick={onGuestLogin}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 rounded-full py-3 flex items-center justify-center gap-3 transition-all group"
                >
                    <span className="material-symbols-outlined text-emerald-400 group-hover:text-white text-sm">person</span>
                    <span className="text-xs font-bold text-emerald-400 group-hover:text-white">Teruskan sebagai Tetamu (Guest)</span>
                </button>
            </div>
            
        </div>
      </div>
    </div>
  );
};