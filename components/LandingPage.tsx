import React, { useState, useEffect, useMemo } from 'react';
import { AppTab } from '../types';
import { PrayerDashboard } from './PrayerDashboard';
import { generateDailyReflection } from '../services/geminiService';
import { getAllIqraProgress } from '../services/iqraCache';

interface LandingPageProps {
    user: any;
    setActiveTab: (tab: AppTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, setActiveTab }) => {
    const [dailyQuote, setDailyQuote] = useState<string>('');
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [lastRead, setLastRead] = useState<{surahName: string, verseKey: string} | null>(null);
    const [iqraStats, setIqraStats] = useState<{level: number, progress: number} | null>(null);

    // --- LOGIC: Smart Surah Recommendation ---
    const recommendedSurah = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); // 5 = Friday
        const hour = now.getHours();

        if (day === 5) {
            return { name: "Al-Kahf", reason: "Sunnah hari Jumaat untuk cahaya mingguan." };
        }
        if (hour >= 20 || hour < 4) {
            return { name: "Al-Mulk", reason: "Pelindung dari azab kubur sebelum tidur." };
        }
        if (hour >= 5 && hour < 9) {
            return { name: "Al-Waqi'ah", reason: "Pembuka pintu rezeki di waktu pagi." };
        }
        return { name: "Ar-Rahman", reason: "Merenung nikmat Tuhan yang tidak terhitung." };
    }, []);

    const fetchDailyWisdom = async () => {
        setLoadingQuote(true);
        try {
            const quote = await generateDailyReflection();
            setDailyQuote(quote);
        } catch (e) {
            setDailyQuote("Ingatlah Allah, maka Dia akan mengingati mu.");
        } finally {
            setLoadingQuote(false);
        }
    };

    useEffect(() => {
        // 1. Ambil Hikmah Harian
        fetchDailyWisdom();

        // 2. Ambil Bacaan Terakhir
        const saved = localStorage.getItem('pulse_last_read');
        if (saved) {
            setLastRead(JSON.parse(saved));
        }

        // 3. Ambil Statistik Iqra
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
        <div className="h-full overflow-y-auto no-scrollbar p-4 md:p-8 animate-fade-in-up">
            <div className="max-w-6xl mx-auto space-y-6 pb-24">
                
                {/* 1. Hero Header: Aluan Peribadi */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Sistem Aktif</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
                            Ahlan, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-secondary">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Ekosistem spiritual anda sedia untuk berkhidmat.</p>
                    </div>
                    <div className="flex gap-2">
                            <button onClick={() => setActiveTab(AppTab.STUDIO)} className="px-4 py-2 rounded-full bg-surface-card border border-white/5 hover:bg-white/10 text-xs font-bold transition-all text-secondary hover:text-white flex items-center gap-2 shadow-lg group">
                                <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">palette</span>
                                Studio Seni
                            </button>
                            <button onClick={() => document.getElementById('prayer-dashboard')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-full bg-surface-card border border-white/5 hover:bg-white/10 text-xs font-bold transition-all text-secondary hover:text-white flex items-center gap-2 shadow-lg group">
                                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">explore</span>
                                Kiblat
                            </button>
                    </div>
                </div>
                
                {/* 2. Prayer Hero Widget */}
                <div id="prayer-dashboard">
                    <PrayerDashboard />
                </div>
                
                {/* 3. Bento Grid Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* A. Live Tutor (Visualizer Card) */}
                    <div 
                        onClick={() => setActiveTab(AppTab.LIVE_TUTOR)}
                        className="col-span-1 md:col-span-2 relative h-64 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-surface-card to-background-dark"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>

                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/30 animate-pulse flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Live Voice API
                                </div>
                                <span className="material-symbols-outlined text-white/50 text-4xl group-hover:text-primary transition-colors">mic</span>
                            </div>
                            
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Tanya Ustaz Nur</h3>
                                <p className="text-slate-400 text-sm max-w-sm">Berbual secara real-time melalui suara mengenai Fiqh, Tafsir, dan kehidupan.</p>
                            </div>
                        </div>

                        {/* Visualizer Animation */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 pb-8 opacity-40 group-hover:opacity-80 transition-opacity px-8">
                            {[...Array(24)].map((_,i) => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-primary rounded-t-full animate-bounce"
                                    style={{ 
                                        height: `${Math.random() * 60 + 10}%`, 
                                        animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                                        animationDelay: `${Math.random() * 0.5}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* B. Daily Wisdom Card */}
                    <div className="relative h-64 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-br from-indigo-900 to-surface-dark flex flex-col p-6 justify-between shadow-lg group hover:border-indigo-500/30 transition-colors">
                        <div className="absolute -right-4 -top-4 text-white/5 pointer-events-none">
                            <span className="material-symbols-outlined text-9xl">format_quote</span>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-black/20 px-2 py-1 rounded border border-indigo-500/20">Refleksi Hari Ini</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); fetchDailyWisdom(); }} 
                                className={`text-indigo-300 hover:text-white transition-colors ${loadingQuote ? 'animate-spin' : ''}`}
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                            </button>
                        </div>
                        <div className="relative z-10 flex-1 flex items-center">
                            <p className="text-lg font-display text-white leading-relaxed italic">
                                "{dailyQuote || 'Memuat hikmah...'}"
                            </p>
                        </div>
                    </div>

                    {/* C. Continue Reading Card */}
                    <div 
                        onClick={() => setActiveTab(AppTab.QURAN)}
                        className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 hover:border-emerald-500/50 transition-all shadow-lg bg-surface-card"
                    >
                        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Bacaan Terakhir</span>
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-emerald-400 transition-colors">arrow_forward</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white font-arabic truncate">
                                    {lastRead ? lastRead.surahName : "Al-Fatihah"}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {lastRead ? `Ayat ${lastRead.verseKey.split(':')[1]}` : "Mula Membaca"}
                                </p>
                                
                                <div className="w-full bg-black/20 rounded-full h-1.5 mt-4">
                                    <div className="bg-emerald-500 h-full rounded-full w-[35%] shadow-glow"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* D. Iqra Hub Progress */}
                    <div 
                        onClick={() => setActiveTab(AppTab.IQRA)}
                        className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 hover:border-blue-500/50 transition-all shadow-lg bg-surface-card"
                    >
                        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                {iqraStats && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/10">
                                        Tahap {iqraStats.level}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Iqra' Journey</h3>
                                <p className="text-slate-400 text-xs mt-1">AI Tajwid Analysis</p>
                                {iqraStats && (
                                    <div className="mt-2 text-[10px] text-blue-300">
                                        {iqraStats.progress}% Selesai
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* E. Recommended Surah (Contextual) */}
                    <div 
                        onClick={() => setActiveTab(AppTab.QURAN)}
                        className="relative h-48 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all shadow-lg bg-surface-card"
                    >
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px]"></div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">auto_stories</span>
                                </div>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/10">Cadangan</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{recommendedSurah.name}</h3>
                                <p className="text-slate-400 text-xs mt-1 leading-tight">{recommendedSurah.reason}</p>
                            </div>
                        </div>
                    </div>

                </div>
                
                {/* Footer Quote */}
                <div className="text-center pt-8 opacity-40">
                    <p className="font-arabic text-xl mb-2">رَبِّ زِدْنِي عِلْمًا</p>
                    <p className="text-xs uppercase tracking-widest">"Wahai Tuhanku, tambahlah ilmuku."</p>
                </div>

            </div>
        </div>
    );
};