import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Login } from './components/Login';
import { QuranReader } from './components/QuranReader';
import { LiveTutor } from './components/LiveTutor';
import { SmartAssistant } from './components/SmartAssistant';
import { CreativeStudio } from './components/CreativeStudio';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { IqraHub } from './components/IqraHub';
import { PrayerDashboard } from './components/PrayerDashboard';
import { Logo } from './components/Logo';
import { AppTab, AudioLog } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [logs, setLogs] = useState<AudioLog[]>([]);

  // Auth Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addLog = (log: AudioLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Loading State for Auth Check
  if (loadingSession) {
      return (
          <div className="h-screen w-full bg-background-dark flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // If not logged in, show Login Page
  if (!session) {
      return <Login />;
  }

  // User Metadata
  const user = session.user;
  const userName = user.user_metadata.full_name || user.email?.split('@')[0] || "Mukmin";
  const userAvatar = user.user_metadata.avatar_url;
  const userInitials = userName.slice(0, 2).toUpperCase();

  const navItems = [
    { id: AppTab.DASHBOARD, label: 'Home', icon: 'grid_view', desc: 'Main Menu' },
    { id: AppTab.QURAN, label: 'Al-Quran', icon: 'menu_book', desc: 'Read & Listen' },
    { id: AppTab.IQRA, label: 'Iqra Hub', icon: 'school', desc: 'Learn Tajwid' },
    { id: AppTab.TANYA_USTAZ, label: 'Tanya Ustaz', icon: 'smart_toy', desc: 'AI Q&A' },
    { id: AppTab.IBADAH, label: 'Ibadah', icon: 'mosque', desc: 'Prayer Times' },
    { id: AppTab.LIVE_TUTOR, label: 'Live Tutor', icon: 'mic', desc: 'Voice Conversation' },
    { id: AppTab.STUDIO, label: 'Creative Studio', icon: 'palette', desc: 'Generate Media' },
    { id: AppTab.LIBRARY, label: 'Library', icon: 'folder', desc: 'Saved Content' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return (
          <div className="h-full w-full overflow-y-auto no-scrollbar p-6 lg:p-12 animate-in fade-in duration-500">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
               <div className="flex items-center gap-5">
                  <div className="w-20 h-20 transition-transform hover:scale-105 duration-700">
                     <Logo className="w-full h-full drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]" />
                  </div>
                  <div className="text-center md:text-left">
                      <h1 className="font-bold text-3xl text-white tracking-tight">NurQuran Pulse</h1>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                         <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                         <p className="text-primary text-xs font-mono uppercase tracking-widest">AI Connected</p>
                      </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 bg-surface-card/40 p-2 pl-6 pr-2 rounded-full border border-white/5 backdrop-blur-md shadow-lg transition-colors group">
                    <div className="text-right mr-2 hidden sm:block">
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{userName}</p>
                        <button onClick={handleSignOut} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider font-bold">Sign Out</button>
                    </div>
                    {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg border-2 border-transparent">
                            {userInitials}
                        </div>
                    )}
               </div>
            </div>

            {/* Greeting / Hero */}
            <div className="mb-16 text-center max-w-2xl mx-auto">
                <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                    Assalamualaikum, <br/>
                    <span className="text-primary">{userName.split(' ')[0]}</span>
                </h2>
                <p className="text-slate-400 text-lg lg:text-xl font-light">
                    Your spiritual journey continues here.
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {navItems.filter(i => i.id !== AppTab.DASHBOARD).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-surface-dark/40 hover:bg-surface-card/80 border border-white/5 hover:border-primary/30 rounded-[32px] transition-all duration-300 hover:-translate-y-2 shadow-lg hover:shadow-neon backdrop-blur-sm overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

                        <div className="relative z-10 w-16 h-16 rounded-2xl bg-surface-card border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-primary/50 group-hover:bg-background-dark transition-all duration-300 shadow-inner">
                            <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary transition-colors">{item.icon}</span>
                        </div>
                        
                        <div className="relative z-10 text-center space-y-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{item.label}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-400">{item.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-20 text-center">
                 <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">NurQuran Pulse v6.0 • Powered by Gemini AI</p>
            </div>
          </div>
        );
      
      case AppTab.QURAN: return <QuranReader onLogUpdate={addLog} />;
      case AppTab.IQRA: return <IqraHub onLogUpdate={addLog} />;
      case AppTab.TANYA_USTAZ: return <SmartAssistant />;
      case AppTab.IBADAH: return <PrayerDashboard />;
      case AppTab.LIVE_TUTOR: return <LiveTutor onLogUpdate={addLog} />;
      case AppTab.STUDIO: return <CreativeStudio />;
      case AppTab.LIBRARY: return <MediaAnalyzer logs={logs} onLogUpdate={addLog} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-dark text-white font-display overflow-hidden relative selection:bg-primary selection:text-background-dark">
      
      {/* Global Background Ambient */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[150px]"></div>
      </div>

      {/* Floating Home Button (Visible when NOT on Dashboard) */}
      {activeTab !== AppTab.DASHBOARD && (
        <div className="absolute top-4 left-4 z-[60] lg:top-6 lg:left-6">
            <button 
                onClick={() => setActiveTab(AppTab.DASHBOARD)}
                className="group flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-surface-dark/60 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-surface-card text-slate-400 hover:text-white transition-all shadow-xl"
            >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">grid_view</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Menu</span>
            </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
         {/* Wrapper to ensure full height and consistent background for components if needed */}
         <div className="w-full h-full bg-surface-dark/0 backdrop-blur-0 transition-all">
             {renderContent()}
         </div>
      </main>

      {/* Mobile Bottom Nav (Persistent) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-surface-dark/95 backdrop-blur-xl border-t border-white/10 z-50 flex justify-between px-6 py-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         {navItems.filter(i => [AppTab.DASHBOARD, AppTab.QURAN, AppTab.IQRA, AppTab.TANYA_USTAZ, AppTab.LIVE_TUTOR].includes(i.id)).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${activeTab === item.id ? 'bg-primary/20 text-primary shadow-neon-sm' : 'text-slate-500 hover:text-white'}`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'filled' : ''} text-[24px]`}>{item.icon}</span>
            </button>
          ))}
      </nav>

    </div>
  );
};

export default App;