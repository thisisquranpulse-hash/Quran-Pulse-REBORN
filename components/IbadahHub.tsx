import React, { useState, useEffect } from 'react';
import { PrayerDashboard } from './PrayerDashboard';

const DZIKIR_LIST = [
    { title: 'Subhanallah', count: 33 },
    { title: 'Alhamdulillah', count: 33 },
    { title: 'Allahu Akbar', count: 33 },
    { title: 'La ilaha illallah', count: 100 },
    { title: 'Astaghfirullah', count: 100 },
];

export const IbadahHub: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'PRAYER' | 'TASBIH'>('PRAYER');
    const [counter, setCounter] = useState(0);
    const [selectedDzikirIndex, setSelectedDzikirIndex] = useState(0);
    const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const saved = localStorage.getItem('pulse_tasbih_counts');
        if (saved) setTotalCounts(JSON.parse(saved));
    }, []);

    const handleIncrement = () => {
        const dzikir = DZIKIR_LIST[selectedDzikirIndex];
        const newCount = counter + 1;
        setCounter(newCount);
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        // Auto reset if limit reached or just track total
        const newTotals = { ...totalCounts, [dzikir.title]: (totalCounts[dzikir.title] || 0) + 1 };
        setTotalCounts(newTotals);
        localStorage.setItem('pulse_tasbih_counts', JSON.stringify(newTotals));

        if (newCount === dzikir.count && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // Triple pulse on goal
        }
    };

    const resetCounter = () => {
        setCounter(0);
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const nextDzikir = () => {
        setSelectedDzikirIndex((prev) => (prev + 1) % DZIKIR_LIST.length);
        setCounter(0);
    };

    return (
        <div className="h-full flex flex-col bg-background-dark/0 overflow-hidden animate-fade-in-up">
            {/* Sub-navigation Tabs */}
            <div className="flex justify-center p-6 gap-4">
                <div className="bg-surface-dark/80 backdrop-blur-xl p-1 rounded-2xl border border-white/10 flex">
                    <button 
                        onClick={() => setActiveSection('PRAYER')}
                        className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSection === 'PRAYER' ? 'bg-primary text-background-dark shadow-neon' : 'text-slate-400 hover:text-white'}`}
                    >
                        Solat & Lokasi
                    </button>
                    <button 
                        onClick={() => setActiveSection('TASBIH')}
                        className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSection === 'TASBIH' ? 'bg-primary text-background-dark shadow-neon' : 'text-slate-400 hover:text-white'}`}
                    >
                        Tasbih Digital
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-8 pb-32">
                {activeSection === 'PRAYER' ? (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <PrayerDashboard />
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto h-full flex flex-col items-center justify-center space-y-12 py-10">
                        {/* Dzikir Display */}
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
                                <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                                {DZIKIR_LIST[selectedDzikirIndex].count} Repetitions Target
                            </div>
                            <h3 className="text-4xl sm:text-5xl font-arabic text-white drop-shadow-glow">
                                {DZIKIR_LIST[selectedDzikirIndex].title}
                            </h3>
                            <button 
                                onClick={nextDzikir}
                                className="text-xs text-secondary hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                Tukar Dzikir
                            </button>
                        </div>

                        {/* Large Counter Ring */}
                        <div className="relative group cursor-pointer" onClick={handleIncrement}>
                            {/* Decorative Rings */}
                            <div className="absolute inset-[-40px] border border-primary/10 rounded-full animate-pulse"></div>
                            <div className="absolute inset-[-20px] border border-primary/20 rounded-full"></div>
                            
                            {/* Main Button */}
                            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-surface-card to-background-dark border-4 border-white/5 shadow-2xl flex flex-col items-center justify-center group-active:scale-95 transition-transform duration-75 relative z-10 overflow-hidden ring-1 ring-primary/20 hover:ring-primary/50">
                                {/* Fill Progress Background */}
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all duration-500 ease-out"
                                    style={{ height: `${Math.min(100, (counter / DZIKIR_LIST[selectedDzikirIndex].count) * 100)}%` }}
                                ></div>
                                
                                <span className="text-7xl font-display font-bold text-white relative z-20 transition-all">
                                    {counter}
                                </span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-2 relative z-20">Tap to Count</span>
                            </div>
                        </div>

                        {/* Reset & Totals */}
                        <div className="w-full grid grid-cols-2 gap-4">
                            <div className="bg-surface-card/40 border border-white/5 rounded-3xl p-6 text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total {DZIKIR_LIST[selectedDzikirIndex].title}</p>
                                <p className="text-2xl font-bold text-white">{totalCounts[DZIKIR_LIST[selectedDzikirIndex].title] || 0}</p>
                            </div>
                            <button 
                                onClick={resetCounter}
                                className="bg-surface-card/40 border border-white/5 hover:border-red-500/50 rounded-3xl p-6 text-center transition-all group"
                            >
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-red-400 mb-1">restart_alt</span>
                                <p className="text-[10px] text-slate-500 group-hover:text-red-400 font-bold uppercase tracking-widest">Reset Current</p>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
