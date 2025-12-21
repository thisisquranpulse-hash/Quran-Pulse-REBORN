import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { Login } from './components/Login';
import { QuranReader } from './components/QuranReader';
import { CreativeStudio } from './components/CreativeStudio';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { IqraHub } from './components/IqraHub';
import { UnifiedAssistant } from './components/UnifiedAssistant';
import { LiveTutor } from './components/LiveTutor';
import { IbadahHub } from './components/IbadahHub';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { ProfileCard } from './components/ProfileCard';
import { AppTab, AudioLog } from './types';
import { generateDailyReflection } from './services/geminiService';

// --- GENERIC MODAL ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode; transparent?: boolean }> = ({ isOpen, onClose, title, children, transparent = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/90 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className={`relative w-full ${transparent ? 'max-w-fit bg-transparent shadow-none border-none' : 'max-w-5xl h-[85vh] bg-surface-dark border border-white/10 rounded-[32px] shadow-2xl'} flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}
      >
        {title && (
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-surface-card/30">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                {title}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
            </button>
            </div>
        )}
        {!title && !transparent && (
             <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/20 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                <span className="material-symbols-outlined">close</span>
            </button>
        )}
        <div className={`flex-1 overflow-hidden ${transparent ? '' : 'bg-gradient-to-b from-surface-dark to-background-dark'}`}>
            {children}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD); 
  const [showProfile, setShowProfile] = useState(false);
  const [logs, setLogs] = useState<AudioLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGuestLogin = () => {
      setSession({ user: { id: 'guest', email: 'guest@nurquran.com', user_metadata: { full_name: 'Guest User' } } });
  };

  const handleSignOut = async () => {
      if (session?.user?.id === 'guest') setSession(null);
      else await supabase.auth.signOut();
      setShowProfile(false);
  };

  const addLog = (log: AudioLog) => setLogs(prev => [...prev, log]);

  if (loading) return (
      <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center">
          <Logo className="w-32 h-32 text-primary animate-pulse shadow-neon rounded-full" />
          <p className="mt-8 text-primary font-display tracking-[0.4em] text-[10px] font-bold uppercase animate-pulse">Initializing Pulse Engine...</p>
      </div>
  );

  if (!session) return <Login onGuestLogin={handleGuestLogin} />;

  return (
    <div className="flex h-screen w-full bg-background-dark text-white font-sans overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-24 flex-col items-center py-8 bg-surface-dark border-r border-white/5 z-20 shadow-2xl">
            <div className="mb-10 p-2 bg-gradient-to-br from-surface-card to-transparent rounded-2xl border border-white/10 shadow-neon-sm cursor-pointer" onClick={() => setActiveTab(AppTab.DASHBOARD)}>
                <Logo className="w-10 h-10 text-white" />
            </div>
            <nav className="flex-1 flex flex-col gap-6 w-full px-4">
                {[
                    { id: AppTab.DASHBOARD, icon: 'grid_view', label: 'Home' },
                    { id: AppTab.IBADAH, icon: 'explore', label: 'Ibadah' },
                    { id: AppTab.QURAN, icon: 'menu_book', label: 'Quran' },
                    { id: AppTab.IQRA, icon: 'school', label: 'Iqra' },
                    { id: AppTab.LIVE_TUTOR, icon: 'mic', label: 'Live' }, 
                    { id: AppTab.TANYA_USTAZ, icon: 'smart_toy', label: 'Ustaz' },
                    { id: AppTab.STUDIO, icon: 'palette', label: 'Studio' },
                    { id: AppTab.LIBRARY, icon: 'folder_open', label: 'Library' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-primary text-background-dark shadow-neon scale-110' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider absolute -bottom-5 bg-black/90 px-2 py-0.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{item.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={() => setShowProfile(true)} className="mt-auto w-12 h-12 rounded-full border-2 border-white/10 hover:border-primary transition-all overflow-hidden shadow-lg hover:scale-105 active:scale-95">
                <div className="w-full h-full bg-surface-card flex items-center justify-center text-xs font-bold text-primary">
                    {session.user.user_metadata?.avatar_url ? <img src={session.user.user_metadata.avatar_url} className="object-cover w-full h-full" /> : session.user.email?.[0].toUpperCase()}
                </div>
            </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-surface-dark/95 border-b border-white/5 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8 text-primary" />
                    <h1 className="font-display font-bold text-lg tracking-tight">NurQuran <span className="text-primary">Pulse</span></h1>
                </div>
                <button onClick={() => setShowProfile(true)} className="w-9 h-9 rounded-full bg-surface-card border border-white/10 text-primary font-bold shadow-md">{session.user.email?.[0].toUpperCase()}</button>
            </header>

            <div className="flex-1 relative overflow-hidden">
                {activeTab === AppTab.DASHBOARD && <LandingPage user={session.user} setActiveTab={setActiveTab} />}
                {activeTab === AppTab.QURAN && <QuranReader onLogUpdate={addLog} />}
                {activeTab === AppTab.IQRA && <IqraHub onLogUpdate={addLog} />}
                {activeTab === AppTab.IBADAH && <IbadahHub />}
                {activeTab === AppTab.LIVE_TUTOR && <LiveTutor onLogUpdate={addLog} />}
                {activeTab === AppTab.TANYA_USTAZ && <UnifiedAssistant onLogUpdate={addLog} className="h-full" />}
                {activeTab === AppTab.STUDIO && <CreativeStudio />}
                {activeTab === AppTab.LIBRARY && <MediaAnalyzer logs={logs} onLogUpdate={addLog} />}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden h-20 bg-surface-dark/95 border-t border-white/5 flex justify-around items-center z-30 backdrop-blur-md">
                {[
                    { id: AppTab.DASHBOARD, icon: 'grid_view' },
                    { id: AppTab.IBADAH, icon: 'explore' },
                    { id: AppTab.QURAN, icon: 'menu_book' },
                    { id: AppTab.TANYA_USTAZ, icon: 'smart_toy' },
                    { id: AppTab.STUDIO, icon: 'palette' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-4 rounded-2xl transition-all ${activeTab === item.id ? 'text-primary -translate-y-3 bg-surface-card shadow-neon' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </button>
                ))}
            </nav>
        </main>

        {/* Profile/Auth Modal */}
        <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} transparent>
            <ProfileCard user={session.user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />
        </Modal>
    </div>
  );
};
