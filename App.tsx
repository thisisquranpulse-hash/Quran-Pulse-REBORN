import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { Login } from './components/Login';
import { QuranReader } from './components/QuranReader';
import { CreativeStudio } from './components/CreativeStudio';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { IqraHub } from './components/IqraHub';
import { UnifiedAssistant } from './components/UnifiedAssistant';
import { LiveTutor } from './components/LiveTutor';
import { PrayerDashboard } from './components/PrayerDashboard';
import { Logo } from './components/Logo';
import { ProfileCard } from './components/ProfileCard';
import { AppTab, AudioLog } from './types';
import { generateDailyReflection } from './services/geminiService';
import { getAllIqraProgress } from './services/iqraCache';

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

// --- DASHBOARD COMPONENT (Internal for App.tsx) ---
const Dashboard: React.FC<{ user: any; setActiveTab: (tab: AppTab) => void }> = ({ user, setActiveTab }) => {
    const [dailyQuote, setDailyQuote] = useState<string>('');
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [lastRead, setLastRead] = useState<{surahName: string, verseKey: string} | null>(null);
    const [iqraStats, setIqraStats] = useState<{level: number, progress: number} | null>(null);

    const recommendedSurah = useMemo(() => {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        if (day === 5) return { name: "Al-Kahf", reason: "Sunnah hari Jumaat" };
        if (hour >= 20 || hour < 4) return { name: "Al-Mulk", reason: "Pelindung sebelum tidur" };
        if (hour >= 5 && hour < 8) return { name: "Al-Waqi'ah", reason: "Pembuka rezeki pagi" };
        return { name: "Ar-Rahman", reason: "Mengingati nikmat Tuhan" };
    }, []);

    const fetchQuote = async () => {
        setLoadingQuote(true);
        const q = await generateDailyReflection();
        setDailyQuote(q);
        setLoadingQuote(false);
    };

    useEffect(() => {
        fetchQuote();
        const saved = localStorage.getItem('pulse_last_read');
        if (saved) setLastRead(JSON.parse(saved));
        
        getAllIqraProgress().then(progs => {
            if (progs.length > 0) {
                const top = progs.sort((a,b) => b.level - a.level)[0];
                setIqraStats({ level: top.level, progress: Math.round((top.completed_pages / 30) * 100) });
            }
        });
    }, []);

    return (
        <div className="h-full overflow-y-auto no-scrollbar p-4 md:p-8 animate-fade-in-up">
            <div className="max-w-6xl mx-auto space-y-6 pb-24">
                <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Pulse System Active</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tight">
                            Ahlan, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-secondary">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab(AppTab.STUDIO)} className="px-4 py-2 rounded-full bg-surface-card border border-white/5 hover:bg-white/10 text-xs font-bold transition-all text-secondary hover:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">palette</span> Art
                        </button>
                        <button onClick={() => document.getElementById('prayer')?.scrollIntoView({behavior:'smooth'})} className="px-4 py-2 rounded-full bg-surface-card border border-white/5 hover:bg-white/10 text-xs font-bold transition-all text-secondary hover:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">explore</span> Qibla
                        </button>
                    </div>
                </div>

                <div id="prayer"><PrayerDashboard /></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => setActiveTab(AppTab.LIVE_TUTOR)} className="col-span-1 md:col-span-2 relative h-64 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-surface-card to-background-dark">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30">Live Voice Ustaz</span>
                                <span className="material-symbols-outlined text-white/50 text-4xl group-hover:text-primary transition-colors">mic</span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Ustaz Nur Live</h3>
                                <p className="text-slate-400 text-sm max-w-sm">Berbual secara real-time mengenai Fiqh dan Tafsir melalui suara.</p>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 pb-6 opacity-30 group-hover:opacity-60 transition-opacity">
                            {[...Array(24)].map((_,i) => (
                                <div key={i} className="w-1.5 bg-primary rounded-t-full animate-bounce" style={{ height: `${Math.random()*60+20}%`, animationDuration: `${Math.random()*0.5+0.5}s` }}></div>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-64 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-br from-indigo-900 to-surface-dark p-6 flex flex-col justify-between shadow-lg group">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-black/20 px-2 py-1 rounded w-fit">Refleksi Hari Ini</span>
                        <p className="text-lg font-display text-white italic leading-relaxed">"{dailyQuote || 'Memuat hikmah...'}"</p>
                        <button onClick={fetchQuote} className="self-end text-indigo-300 hover:text-white transition-colors">
                            <span className={`material-symbols-outlined ${loadingQuote ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>

                    <div onClick={() => setActiveTab(AppTab.QURAN)} className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 bg-surface-card hover:border-emerald-500/50 transition-all p-6 flex flex-col justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Teruskan Bacaan</span>
                        <div>
                            <h3 className="text-2xl font-bold text-white font-arabic">{lastRead?.surahName || "Al-Fatihah"}</h3>
                            <p className="text-slate-400 text-xs mt-1">Ayat {lastRead?.verseKey.split(':')[1] || "1"}</p>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                            <div className="bg-emerald-500 h-full rounded-full w-1/3 shadow-glow"></div>
                        </div>
                    </div>

                    <div onClick={() => setActiveTab(AppTab.IQRA)} className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 bg-surface-card hover:border-blue-500/50 transition-all p-6 flex flex-col justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Iqra Hub</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">Tahap {iqraStats?.level || 1}</h3>
                            <p className="text-slate-400 text-xs mt-1">{iqraStats?.progress || 0}% selesai</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform self-end">
                            <span className="material-symbols-outlined">school</span>
                        </div>
                    </div>

                    <div onClick={() => setActiveTab(AppTab.QURAN)} className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 bg-surface-card hover:border-purple-500/50 transition-all p-6 flex flex-col justify-between">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Rekomendasi</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">{recommendedSurah.name}</h3>
                            <p className="text-slate-400 text-xs mt-1">{recommendedSurah.reason}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform self-end">
                            <span className="material-symbols-outlined">auto_stories</span>
                        </div>
                    </div>
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
          <Logo className="w-32 h-32 text-primary animate-pulse" />
          <p className="mt-8 text-primary font-display tracking-[0.2em] text-xs uppercase">Initializing Pulse...</p>
      </div>
  );

  if (!session) return <Login onGuestLogin={handleGuestLogin} />;

  return (
    <div className="flex h-screen w-full bg-background-dark text-white font-sans overflow-hidden">
        <aside className="hidden md:flex w-24 flex-col items-center py-8 bg-surface-dark border-r border-white/5 z-20 shadow-2xl">
            <div className="mb-10 p-2 bg-gradient-to-br from-surface-card to-transparent rounded-2xl border border-white/10 shadow-neon-sm">
                <Logo className="w-10 h-10 text-white" />
            </div>
            <nav className="flex-1 flex flex-col gap-6 w-full px-4">
                {[
                    { id: AppTab.DASHBOARD, icon: 'grid_view', label: 'Home' },
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
                        className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-primary text-background-dark shadow-neon' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider absolute -bottom-4 bg-black/80 px-2 py-0.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">{item.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={() => setShowProfile(true)} className="mt-auto w-12 h-12 rounded-full border-2 border-white/10 hover:border-primary transition-colors overflow-hidden">
                <div className="w-full h-full bg-surface-card flex items-center justify-center text-xs font-bold text-primary">
                    {session.user.user_metadata?.avatar_url ? <img src={session.user.user_metadata.avatar_url} className="object-cover" /> : session.user.email?.[0].toUpperCase()}
                </div>
            </button>
        </aside>

        <main className="flex-1 relative overflow-hidden flex flex-col">
            <header className="md:hidden flex items-center justify-between p-4 bg-surface-dark/95 border-b border-white/5 z-20">
                <div className="flex items-center gap-3"><Logo className="w-8 h-8 text-primary" /><h1 className="font-display font-bold text-lg">Pulse</h1></div>
                <button onClick={() => setShowProfile(true)} className="w-9 h-9 rounded-full bg-surface-card border border-white/10 text-primary font-bold">{session.user.email?.[0].toUpperCase()}</button>
            </header>

            <div className="flex-1 relative overflow-hidden">
                {activeTab === AppTab.DASHBOARD && <Dashboard user={session.user} setActiveTab={setActiveTab} />}
                {activeTab === AppTab.QURAN && <QuranReader onLogUpdate={addLog} />}
                {activeTab === AppTab.IQRA && <IqraHub onLogUpdate={addLog} />}
                {activeTab === AppTab.LIVE_TUTOR && <LiveTutor onLogUpdate={addLog} />}
                {activeTab === AppTab.TANYA_USTAZ && <UnifiedAssistant onLogUpdate={addLog} className="h-full" />}
                {activeTab === AppTab.STUDIO && <CreativeStudio />}
                {activeTab === AppTab.LIBRARY && <MediaAnalyzer logs={logs} onLogUpdate={addLog} />}
            </div>

            <nav className="md:hidden h-20 bg-surface-dark/95 border-t border-white/5 flex justify-around items-center z-30">
                {[
                    { id: AppTab.DASHBOARD, icon: 'grid_view' },
                    { id: AppTab.QURAN, icon: 'menu_book' },
                    { id: AppTab.LIVE_TUTOR, icon: 'mic' }, 
                    { id: AppTab.TANYA_USTAZ, icon: 'smart_toy' },
                    { id: AppTab.STUDIO, icon: 'palette' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-3 rounded-full transition-all ${activeTab === item.id ? 'text-primary -translate-y-2 bg-surface-card shadow-neon-sm' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </button>
                ))}
            </nav>
        </main>

        <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} transparent>
            <ProfileCard user={session.user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />
        </Modal>
    </div>
  );
};