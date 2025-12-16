import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Redirects back to the app after login
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Error logging in: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-dark relative overflow-hidden font-display text-white">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-surface-dark/60 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl p-8 flex flex-col items-center text-center">
            
            {/* Logo Animation */}
            <div className="w-24 h-24 mb-8 transition-transform hover:scale-105 duration-700">
                 <Logo className="w-full h-full drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]" />
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight">NurQuran Pulse</h1>
            <p className="text-slate-400 text-sm mb-10">Your AI-Powered Islamic Learning Companion</p>

            <div className="w-full space-y-4">
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-background-dark font-bold py-4 px-6 rounded-2xl hover:bg-slate-100 transition-all transform active:scale-95 shadow-neon-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>

                <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
                    By continuing, you agree to our Terms of Service. 
                    Your progress in Iqra Hub and Quran reading will be synced to your account.
                </p>
            </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center opacity-40">
            <p className="text-[10px] font-mono tracking-widest">SECURE LOGIN • SUPABASE AUTH</p>
        </div>
      </div>
    </div>
  );
};
