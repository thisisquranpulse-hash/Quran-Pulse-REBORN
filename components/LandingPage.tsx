import React, { useState, useEffect, useMemo } from 'react';
import { AppTab } from '../types';
import { PrayerDashboard } from './PrayerDashboard';
import { generateDailyReflection, generateDailyHadith } from '../services/geminiService';
import { getAllIqraProgress } from '../services/iqraCache';

interface LandingPageProps {
    user: any;
    setActiveTab: (tab: AppTab) => void;
}

interface HadithData {
    hadithText: string;
    source: string;
    explanation: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, setActiveTab }) => {
    const [dailyQuote, setDailyQuote] = useState<string>('');
    const [dailyHadith, setDailyHadith] = useState<HadithData | null>(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loadingHadith, setLoadingHadith] = useState(false);
    const [lastRead, setLastRead] = useState<{surahName: string, verseKey: string} | null>(null);
    const [iqraStats, setIqraStats] = useState<{level: number, progress: number} | null>(null);

    // --- Rekomendasi Surah Pintar ---
    const recommendedSurah = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); // 5 = Friday
        const hour = now.getHours();

        if (day === 5) {
            return { name: "Al-Kahf", reason: "Sunnah hari Jumaat untuk keberkatan mingguan." };
        }
        if (hour >= 20 || hour < 4) {
            return { name: "Al-Mulk", reason: "Pelindung sebelum tidur dari azab kubur." };
        }
        if (hour >= 5 && hour < 9) {
            return { name: "Al-Waqi'ah", reason: "Membuka pintu rezeki di waktu pagi." };
        }
        return { name: "Ar-Rahman", reason: "Merenung nikmat Tuhan yang amat luas." };
    }, []);

    const fetchDailyWisdom = async () => {
        setLoadingQuote(true);
        try {
            const quote = await generateDailyReflection();
            setDailyQuote(quote);
        } catch (e) {
            setDailyQuote("Cukuplah Allah bagiku, tiada Tuhan melainkan Dia.");
        } finally {
            setLoadingQuote(false);
        }
    };

    const fetchHadith = async () => {
        setLoadingHadith(true);
        try {
            const data = await generateDailyHadith();
            setDailyHadith(data);
        } catch (e) {
            console.error("Failed to fetch Hadith", e);
        } finally {
            setLoadingHadith(false);
        }
    };

    useEffect(() => {
        fetchDailyWisdom();
        fetchHadith();

        const saved = localStorage.getItem('pulse_last_read');
        if (saved) {
            setLastRead(JSON.parse(saved));
        }

        getAllIqraProgress().then(progs => {
            if (progs.length > 0) {
                const sorted = progs.sort((a,b) => b.level - a.level);
                const top = sorted[0];
                setIqraStats({ 
                    level: top.level, 
                    progress: Math.round((top.completed_pages / 30) * 100) 
                });
            }
        });
    }, []);

    return (
        <div className="h-full overflow-y-auto no-scrollbar p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in-up">
            <div className="max-w-7xl mx-auto space-y-8 pb-32">
                
                {/* 1. Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-neon"></span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Stellar Dashboard Active</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
                            Ahlan, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-secondary">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-3 font-light">Navigasi spiritual anda bermula di sini.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => setActiveTab(AppTab.STUDIO)} className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-surface-card border border-white/5 hover:border-primary/30 text-xs font-bold transition-all text-secondary hover:text-white flex items-center justify-center gap-2 shadow-xl group">
                            <span className="material-symbols-outlined text-sm group-hover:rotate-45 transition-transform">palette</span>
                            Studio Seni
                        </button>
                    </div>
                </div>
                
                {/* 2. Prayer Dashboard Hero */}
                <div className="rounded-[32px] sm:rounded-[40px] overflow-hidden border border-white/5 shadow-2xl transition-all hover:shadow-glow">
                    <PrayerDashboard />
                </div>
                
                {/* 3. Bento Grid Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* A. Hadith of the Day (Prominent Card) */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 relative rounded-[32px] sm:rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-surface-card/60 to-background-dark/80 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-6 sm:gap-8 items-center group hover:border-emerald-500/30 transition-all duration-500">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                         
                         <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-3xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg relative z-10">
                              <span className="material-symbols-outlined text-3xl sm:text-4xl text-emerald-400">book_2</span>
                         </div>

                         <div className="flex-1 space-y-4 relative z-10 w-full">
                              <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">Hadith Hari Ini</span>
                                  <button onClick={fetchHadith} disabled={loadingHadith} className={`text-slate-500 hover:text-white transition-colors ${loadingHadith ? 'animate-spin' : ''}`}>
                                      <span className="material-symbols-outlined text-sm">refresh</span>
                                  </button>
                              </div>
                              
                              {loadingHadith ? (
                                  <div className="space-y-3 animate-pulse">
                                      <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                      <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                  </div>
                              ) : dailyHadith ? (
                                  <>
                                      <p className="text-lg sm:text-xl md:text-2xl font-display text-white leading-relaxed italic font-light">
                                          "{dailyHadith.hadithText}"
                                      </p>
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-white/5">
                                          <div>
                                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Sumber</p>
                                              <p className="text-sm text-slate-300 font-medium">{dailyHadith.source}</p>
                                          </div>
                                          <div className="max-w-md">
                                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pengajaran</p>
                                              <p className="text-xs text-slate-400 italic leading-relaxed">{dailyHadith.explanation}</p>
                                          </div>
                                      </div>
                                  </>
                              ) : (
                                  <p className="text-slate-500">Memuat turun keberkatan...</p>
                              )}
                         </div>
                    </div>

                    {/* B. Live Tutor (Visualizer Card) */}
                    <div 
                        onClick={() => setActiveTab(AppTab.LIVE_TUTOR)}
                        className="col-span-1 sm:col-span-2 lg:col-span-2 relative h-72 rounded-[32px] sm:rounded-[40px] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-2xl bg-gradient-to-br from-surface-card via-background-dark to-black"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>

                        <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30 backdrop-blur-md flex items-center gap-2 shadow-neon-sm animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Live Voice API
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary transition-all">
                                    <span className="material-symbols-outlined text-white/50 text-xl sm:text-2xl group-hover:text-primary group-hover:scale-110 transition-all">mic</span>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Tanya Ustaz Nur</h3>
                                <p className="text-slate-400 text-sm sm:text-base max-w-sm font-light leading-relaxed">Perbualan suara real-time untuk bimbingan Fiqh dan Tajwid.</p>
                            </div>
                        </div>

                        {/* Visualizer Animation Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-center gap-1 sm:gap-1.5 pb-10 opacity-30 group-hover:opacity-60 transition-opacity px-8 sm:px-12">
                            {[...Array(32)].map((_,i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-primary rounded-t-full animate-bounce"
                                    style={{ 
                                        height: `${Math.random() * 70 + 10}%`, 
                                        animationDuration: `${Math.random() * 0.4 + 0.6}s`,
                                        animationDelay: `${Math.random() * 0.5}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* C. Daily Wisdom Card */}
                    <div className="col-span-1 relative h-72 rounded-[32px] sm:rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-surface-card to-background-dark flex flex-col p-8 justify-between shadow-2xl group transition-all hover:border-secondary/30">
                        <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                            <span className="material-symbols-outlined text-[150px] sm:text-[180px]">flare</span>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">Refleksi Harian</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); fetchDailyWisdom(); }} 
                                className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10 ${loadingQuote ? 'animate-spin' : ''}`}
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                            </button>
                        </div>
                        <div className="relative z-10 flex-1 flex items-center">
                            <p className="text-lg sm:text-xl font-display text-white leading-relaxed italic font-light line-clamp-4">
                                "{dailyQuote || 'Memetik hikmah...'}"
                            </p>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-4">NurQuran AI Engine</div>
                    </div>

                    {/* D. Continue Reading Card */}
                    <div 
                        onClick={() => setActiveTab(AppTab.QURAN)}
                        className="col-span-1 relative h-56 rounded-[32px] sm:rounded-[40px] overflow-hidden group cursor-pointer border border-white/5 hover:border-emerald-500/50 transition-all shadow-2xl bg-surface-card/40 backdrop-blur-md"
                    >
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Al-Quran</span>
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all">arrow_forward</span>
                            </div>
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white font-arabic truncate mb-1">
                                    {lastRead ? lastRead.surahName : "Al-Fatihah"}
                                </h3>
                                <p className="text-slate-400 text-[10px] sm:text-xs font-light uppercase tracking-widest">
                                    {lastRead ? `Ayat ${lastRead.verseKey.split(':')[1]}` : "Mulakan Bacaan"}
                                </p>
                                
                                <div className="w-full bg-black/40 rounded-full h-1.5 mt-6">
                                    <div className="bg-emerald-500 h-full rounded-full w-[40%] shadow-glow transition-all duration-1000"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* E. Iqra Journey Card */}
                    <div 
                        onClick={() => setActiveTab(AppTab.IQRA)}
                        className="col-span-1 relative h-56 rounded-[32px] sm:rounded-[40px] overflow-hidden group cursor-pointer border border-white/5 hover:border-blue-500/50 transition-all shadow-2xl bg-surface-card/40 backdrop-blur-md"
                    >
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                                    <span className="material-symbols-outlined text-2xl">school</span>
                                </div>
                                {iqraStats && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/10 font-bold uppercase">
                                        Tahap {iqraStats.level}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Iqra' Hub</h3>
                                <p className="text-slate-400 text-[10px] sm:text-xs font-light uppercase tracking-widest mt-1">Validasi Tajwid AI</p>
                                {iqraStats && (
                                    <div className="mt-4 text-[10px] text-blue-400 font-bold">
                                        {iqraStats.progress}% Selesai
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* F. Recommended Card */}
                    <div 
                        onClick={() => setActiveTab(AppTab.QURAN)}
                        className="col-span-1 relative h-56 rounded-[32px] sm:rounded-[40px] overflow-hidden group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all shadow-2xl bg-surface-card/40 backdrop-blur-md"
                    >
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform"></div>
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg">
                                    <span className="material-symbols-outlined text-2xl">auto_stories</span>
                                </div>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/10 font-bold uppercase">Cadangan</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Surah {recommendedSurah.name}</h3>
                                <p className="text-slate-400 text-[10px] sm:text-xs font-light leading-relaxed line-clamp-2">{recommendedSurah.reason}</p>
                            </div>
                        </div>
                    </div>

                </div>
                
                {/* Footer Section */}
                <div className="text-center pt-12 pb-12 opacity-30">
                    <p className="font-arabic text-2xl sm:text-3xl mb-4">رَبِّ زِدْنِي عِلْمًا</p>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] font-bold">"Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan."</p>
                </div>

            </div>
        </div>
    );
};