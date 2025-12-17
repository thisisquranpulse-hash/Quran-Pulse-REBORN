import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';

export const Login: React.FC = () => {
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
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
            throw new Error("Passwords do not match");
        }
        if (!fullName.trim()) {
            throw new Error("Please enter your full name");
        }

        const { error, data } = await supabase.auth.signUp({
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
             setMessage({ type: 'success', text: 'Signup successful! Please check your email.' });
             setLoading(false);
             return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
                        {isSignUp ? 'Sign up' : 'Log in'}
                    </h1>
                    <p className="text-primary text-[10px] font-mono tracking-widest uppercase">NurQuran Pulse</p>
                </div>
                <button 
                    onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                >
                    {isSignUp ? 'Log in' : 'Create account'}
                </button>
            </div>

            {/* Logo Watermark */}
            <div className="absolute -right-6 top-12 opacity-10 pointer-events-none">
                 <Logo className="w-40 h-40" />
            </div>

            {/* Messages */}
            {message && (
                <div className={`w-full mb-6 p-3 rounded-2xl text-xs font-medium text-center animate-in fade-in zoom-in-95 ${message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
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
                            placeholder="Full Name"
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
                        placeholder="E-mail address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                    />
                </div>
                
                <div className="group relative">
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-background-dark/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:bg-background-dark focus:border-primary/50 transition-all shadow-inner"
                    />
                    {!isSignUp && (
                        <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-primary transition-colors">
                            Forgot?
                        </button>
                    )}
                </div>

                {/* Confirm Password - Sign Up Only */}
                {isSignUp && (
                    <div className="group animate-in slide-in-from-left duration-300 fade-in delay-75">
                        <input 
                            type="password" 
                            placeholder="Confirm Password"
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
                        <span className="text-xs text-slate-400 select-none">Remember me</span>
                    </div>
                )}

                {/* Submit Action - Cyan Pill Button */}
                <div className="pt-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-500 leading-tight max-w-[150px]">
                        By continuing, you agree to our Terms of Service.
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
                <span className="text-[10px] text-slate-500 uppercase">Or continue with</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            {/* Google Pill */}
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-surface-card hover:bg-surface-hover border border-white/5 rounded-full py-3 flex items-center justify-center gap-3 transition-colors group"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                <span className="text-xs font-medium text-slate-400 group-hover:text-white">Google</span>
            </button>
        </div>
      </div>
    </div>
  );
};