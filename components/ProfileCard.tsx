import React from 'react';
import { Session } from '@supabase/supabase-js';

interface ProfileCardProps {
    user: Session['user'];
    onSignOut: () => void;
    onClose: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onSignOut, onClose }) => {
    const name = user.user_metadata.full_name || user.email?.split('@')[0] || "Mukmin";
    const avatar = user.user_metadata.avatar_url;
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    return (
        <div className="relative w-[360px] rounded-[40px] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-surface-dark/90 backdrop-blur-2xl flex flex-col p-8 text-white font-display animate-in zoom-in-95 duration-300">
            
            {/* Decor Elements (Blue Glows) */}
            <div className="absolute -right-20 top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -left-20 bottom-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex flex-col">
                    <span className="text-5xl font-light tracking-tighter text-white">{month}</span>
                    <span className="text-5xl font-bold tracking-tighter text-primary">{year}</span>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-background-dark transition-all text-slate-400 hover:text-background-dark">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            {/* Profile Section - Minimalist Blue */}
            <div className="flex flex-col items-center mb-10 relative z-10">
                <div className="w-24 h-24 rounded-full p-1 border border-primary/30 mb-4 relative">
                     <div className="w-full h-full rounded-full overflow-hidden bg-background-dark">
                         {avatar ? (
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-surface-card">
                                {name.slice(0, 2).toUpperCase()}
                            </div>
                         )}
                     </div>
                     {/* Online Indicator */}
                     <div className="absolute bottom-1 right-1 w-4 h-4 bg-background-dark rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                     </div>
                </div>
                
                <h2 className="text-xl font-bold tracking-tight mb-1 text-white">{name}</h2>
                <p className="text-xs text-primary uppercase tracking-widest font-bold">Premium Member</p>
            </div>

            {/* Stats - Vertical List with Cyan Icons */}
            <div className="space-y-3 mb-10 relative z-10">
                <div className="flex items-center justify-between p-4 rounded-[20px] bg-background-dark/50 hover:bg-background-dark transition-colors cursor-default border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-sm">auto_stories</span>
                        </div>
                        <span className="text-sm font-medium text-slate-300">Surahs Read</span>
                    </div>
                    <span className="text-lg font-bold text-white">114</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-[20px] bg-background-dark/50 hover:bg-background-dark transition-colors cursor-default border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-sm">military_tech</span>
                        </div>
                        <span className="text-sm font-medium text-slate-300">Current Rank</span>
                    </div>
                    <span className="text-lg font-bold text-white">Hafiz</span>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-4 mt-auto relative z-10">
                 <div className="flex flex-col">
                     <span className="text-[10px] text-slate-500 uppercase tracking-wider">Session ID</span>
                     <span className="text-xs font-mono text-slate-400">#8291-AB</span>
                 </div>

                 <button 
                    onClick={onSignOut}
                    className="h-12 px-6 bg-primary text-background-dark rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-neon hover:scale-105 transition-all flex items-center gap-2 group"
                 >
                    Sign Out
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                 </button>
            </div>
        </div>
    );
};
