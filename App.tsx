import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Login } from './components/Login';
import { QuranReader } from './components/QuranReader';
import { CreativeStudio } from './components/CreativeStudio';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { IqraHub } from './components/IqraHub';
import { PrayerDashboard } from './components/PrayerDashboard';
import { Logo } from './components/Logo';
import { Bismillah } from './components/Bismillah';
import { ProfileCard } from './components/ProfileCard';
import { AudioLog } from './types';

// Generic Modal Component
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
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400 hover:text-white">close</span>
            </button>
            </div>
        )}
        <div className={`flex-1 overflow-hidden relative ${transparent ? '' : ''}`}>
          {children}
        </div>
      </div>
       {/* Close on backdrop click for transparent modals */}
       {transparent && <div className="absolute inset-0 -z-10" onClick={onClose}></div>}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [logs, setLogs] = useState<AudioLog[]>([]);

  // Modal States
  const [showStudio, setShowStudio] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Scroll Refs
  const prayerRef = useRef<HTMLDivElement>(null);
  const quranRef = useRef<HTMLDivElement>(null);
  const iqraRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auth Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setShowProfile(false);
  };

  if (loadingSession) {
      return (
          <div className="h-screen w-full bg-background-dark flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!session) {
      return <Login />;
  }

  const user = session.user;
  const userName = user.user_metadata.full_name || user.email?.split('@')[0] || "Mukmin";
  const userAvatar = user.user_metadata.avatar_url;

  return (
    <div className="flex flex-col h-screen bg-background-dark text-white font-display overflow-hidden relative selection:bg-primary selection:text-background-dark">
      
      {/* 3-Tone Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0 fixed">
          <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-surface-dark blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full h-full relative z-10 overflow-y-auto no-scrollbar scroll-smooth">
         
         <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-10 space-y-12 pb-40">
            
            {/* Header */}
            <header className="flex justify-between items-center py-4">
               <div className="flex items-center gap-4">
                   {/* Logo */}
                   <div className="w-12 h-12 bg-surface-card rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                        <Logo className="w-8 h-8 text-primary" />
                   </div>
                   <div className="hidden md:block">
                       <p className="text-xs text-secondary font-medium tracking-wider uppercase">Welcome back,</p>
                       <h1 className="text-lg font-bold text-white tracking-tight">{userName}</h1>
                   </div>
               </div>
               
               {/* Nav Links (Desktop) */}
               <nav className="hidden md:flex items-center gap-1 bg-surface-card/50 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
                   {[
                       { name: 'Prayer', icon: 'schedule', ref: prayerRef },
                       { name: 'Quran', icon: 'menu_book', ref: quranRef },
                       { name: 'Iqra', icon: 'school', ref: iqraRef }
                   ].map((item, idx) => (
                       <button 
                            key={idx}
                            onClick={() => scrollToSection(item.ref)}
                            className="px-4 py-2 rounded-full text-xs font-bold text-secondary hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                       >
                           <span className="material-symbols-outlined text-sm">{item.icon}</span>
                           {item.name}
                       </button>
                   ))}
               </nav>

               {/* Profile */}
               <button 
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:border-primary transition-colors shadow-lg"
               >
                    {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-surface-card flex items-center justify-center text-xs font-bold text-primary">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                    )}
               </button>
            </header>

            {/* --- HERO SECTION: Daily Verse --- */}
            <section className="relative w-full rounded-[40px] overflow-hidden bg-gradient-to-br from-surface-card to-background-dark border border-white/5 shadow-2xl group transition-all duration-500 hover:shadow-neon/20">
                {/* Background Art */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                     <Bismillah className="absolute -right-20 -top-20 w-[600px] h-[600px] text-white rotate-12" />
                </div>
                
                <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner backdrop-blur-sm">
                        <span className="material-symbols-outlined text-3xl text-primary">format_quote</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-arabic font-bold text-white mb-6 leading-relaxed drop-shadow-lg">
                        وَقَالَ رَبُّكُمُ ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ
                    </h2>
                    
                    <div className="max-w-2xl space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            "And your Lord says, Call on Me; I will answer your (Prayer)."
                        </h3>
                        <p className="text-secondary text-sm font-medium tracking-wide uppercase mt-4">
                            Surah Ghafir, Verse 60
                        </p>
                    </div>

                    <div className="mt-8 flex gap-4">
                         <button onClick={() => scrollToSection(quranRef)} className="px-6 py-3 rounded-full bg-primary text-background-dark font-bold text-sm shadow-neon hover:scale-105 transition-transform">
                             Read Quran
                         </button>
                         <button onClick={() => scrollToSection(prayerRef)} className="px-6 py-3 rounded-full bg-white/5 text-white border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors">
                             View Times
                         </button>
                    </div>
                </div>
            </section>

            {/* --- DASHBOARD GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Card 1: Daily Stats */}
                 <div className="glass-panel rounded-3xl p-6 flex items-center justify-between group cursor-default">
                     <div>
                         <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Hijri Date</p>
                         <h3 className="text-xl font-bold text-white">12 Rabi' al-Awwal</h3>
                         <p className="text-xs text-primary mt-1 font-mono">1446 AH</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">calendar_month</span>
                     </div>
                 </div>

                 {/* Card 2: Last Read */}
                 <div className="glass-panel rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => scrollToSection(quranRef)}>
                     <div>
                         <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Continue Reading</p>
                         <h3 className="text-xl font-bold text-white">Surah Al-Mulk</h3>
                         <p className="text-xs text-slate-400 mt-1">Ayah 12</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">menu_book</span>
                     </div>
                 </div>

                 {/* Card 3: Quick Action */}
                 <div className="glass-panel rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => setShowStudio(true)}>
                     <div>
                         <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Creative Studio</p>
                         <h3 className="text-xl font-bold text-white">Generate Media</h3>
                         <p className="text-xs text-slate-400 mt-1">AI Powered</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">palette</span>
                     </div>
                 </div>
            </div>


            {/* 1. Ibadah (Prayer) Section */}
            <section ref={prayerRef} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-1.5 h-6 rounded-full bg-primary"></span>
                    <h2 className="text-xl font-bold text-white">Prayer Times</h2>
                </div>
                <PrayerDashboard />
            </section>

            {/* 2. Al-Quran Section */}
            <section ref={quranRef} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-1.5 h-6 rounded-full bg-primary"></span>
                    <h2 className="text-xl font-bold text-white">Al-Quran & AI Companion</h2>
                </div>
                <div className="h-[800px] glass-panel rounded-[40px] overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 z-0 opacity-5 pointer-events-none">
                        <Bismillah className="w-96 h-96" />
                    </div>
                    <QuranReader onLogUpdate={addLog} />
                </div>
            </section>

            {/* 3. Iqra Hub Section */}
            <section ref={iqraRef} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-1.5 h-6 rounded-full bg-primary"></span>
                    <h2 className="text-xl font-bold text-white">Iqra' Learning Hub</h2>
                </div>
                <div className="h-[800px] glass-panel rounded-[40px] overflow-hidden shadow-2xl">
                    <IqraHub onLogUpdate={addLog} />
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-12 border-t border-white/5 mt-12">
                 <div className="flex justify-center mb-4 opacity-50">
                    <Logo className="w-8 h-8" />
                 </div>
                 <p className="text-xs text-secondary uppercase tracking-widest font-bold">NurQuran Pulse v6.0</p>
                 <p className="text-[10px] text-slate-600 mt-2">Designed with Ihsan. Powered by Gemini.</p>
            </footer>

         </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
          <button 
             onClick={() => setShowLibrary(true)}
             className="w-14 h-14 rounded-full bg-surface-card border border-white/10 shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-surface-hover hover:scale-110 transition-all tooltip-trigger group"
          >
              <span className="material-symbols-outlined">folder</span>
              <span className="absolute right-16 bg-background-dark/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">Library</span>
          </button>
      </div>

      {/* Modals */}
      <Modal isOpen={showStudio} onClose={() => setShowStudio(false)} title="Creative Studio">
          <CreativeStudio />
      </Modal>

      <Modal isOpen={showLibrary} onClose={() => setShowLibrary(false)} title="Media Library & Analyzer">
          <MediaAnalyzer logs={logs} onLogUpdate={addLog} />
      </Modal>
      
      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} transparent>
         <ProfileCard user={session.user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />
      </Modal>

    </div>
  );
};

export default App;