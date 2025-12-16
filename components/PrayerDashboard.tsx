import React, { useEffect, useState } from 'react';
import { getPrayerTimes, getQiblaDirection } from '../services/prayerApi';
import { PrayerTimes } from '../types';

export const PrayerDashboard: React.FC = () => {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [qibla, setQibla] = useState<number>(292); // Default for Malaysia
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [nextPrayer, setNextPrayer] = useState<string>('');
    const [timeToNext, setTimeToNext] = useState<string>('');

    useEffect(() => {
        // 1. Get Location
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude });
            
            // 2. Fetch API Data
            const times = await getPrayerTimes(latitude, longitude);
            setPrayerTimes(times);
            const qDir = await getQiblaDirection(latitude, longitude);
            setQibla(qDir);
            
            if (times) calculateNextPrayer(times);

        }, (err) => {
            console.error("Loc error", err);
            // Fallback KL
            getPrayerTimes(3.1390, 101.6869).then(t => {
                setPrayerTimes(t);
                if(t) calculateNextPrayer(t);
            });
        });

        // 3. Device Orientation for Compass
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha) {
                // simple heading calc (works on mobile mostly)
                setHeading(360 - event.alpha); 
            }
        };
        window.addEventListener('deviceorientation', handleOrientation);

        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const calculateNextPrayer = (times: PrayerTimes) => {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const timeToMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const list = [
            { name: 'Fajr', t: timeToMins(times.fajr) },
            { name: 'Dhuhr', t: timeToMins(times.dhuhr) },
            { name: 'Asr', t: timeToMins(times.asr) },
            { name: 'Maghrib', t: timeToMins(times.maghrib) },
            { name: 'Isha', t: timeToMins(times.isha) },
        ];

        let found = false;
        for (const p of list) {
            if (p.t > currentMins) {
                setNextPrayer(p.name);
                const diff = p.t - currentMins;
                const h = Math.floor(diff/60);
                const m = diff%60;
                setTimeToNext(`${h}h ${m}m`);
                found = true;
                break;
            }
        }
        
        if (!found) {
            setNextPrayer("Fajr (Tom)");
            setTimeToNext("Tomorrow");
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Card */}
                <div className="bg-gradient-to-r from-surface-card to-background-dark border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-1 tracking-tight text-white">{prayerTimes?.hijri || "Loading..."}</h2>
                            <p className="text-slate-400">{prayerTimes?.date}</p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                                <span className="text-sm font-bold text-primary uppercase">Next: {nextPrayer} in {timeToNext}</span>
                            </div>
                        </div>

                        {/* Qibla Compass Visualization */}
                        <div className="relative w-32 h-32 border-4 border-white/10 rounded-full flex items-center justify-center bg-background-dark shadow-inner">
                            {/* Needle */}
                            <div 
                                className="absolute w-1 h-14 bg-red-500 rounded-full origin-bottom top-2 transition-transform duration-500 ease-out z-20"
                                style={{ transform: `rotate(${qibla - heading}deg)` }}
                            ></div>
                             <div className="absolute w-2 h-2 bg-white rounded-full z-30"></div>
                             
                             {/* Kaaba Icon Marker */}
                             <div 
                                className="absolute top-0 text-xl transition-transform duration-500"
                                style={{ transform: `rotate(${-(heading)}deg) translateY(-40px)` }}
                             >
                                🕋
                             </div>
                             <p className="absolute bottom-6 text-[10px] text-slate-500">Qibla</p>
                        </div>
                    </div>
                </div>

                {/* Prayer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {prayerTimes && Object.entries(prayerTimes).slice(0, 6).map(([name, time]) => (
                        <div key={name} className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-all ${name.toLowerCase().includes(nextPrayer.toLowerCase()) ? 'bg-primary text-background-dark border-primary shadow-neon' : 'bg-surface-card border-white/5 text-slate-300'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{name}</span>
                            <span className="text-xl font-bold font-mono">{time}</span>
                        </div>
                    ))}
                </div>

                {/* Additional Tools Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tasbih */}
                    <div className="bg-surface-card border border-white/10 rounded-3xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                             <span className="material-symbols-outlined text-primary">radio_button_checked</span>
                             Digital Tasbih
                        </h3>
                        <div className="flex flex-col items-center">
                            <button className="w-32 h-32 rounded-full bg-background-dark border-4 border-surface-hover shadow-xl flex items-center justify-center active:scale-95 transition-transform">
                                <span className="text-4xl font-mono text-white">0</span>
                            </button>
                            <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">Tap to count</p>
                        </div>
                    </div>

                    {/* Doa of the Day */}
                    <div className="bg-surface-card border border-white/10 rounded-3xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                             <span className="material-symbols-outlined text-emerald-400">volunteer_activism</span>
                             Doa Hari Ini
                        </h3>
                        <div className="bg-background-dark/50 p-4 rounded-xl border border-white/5">
                            <p className="text-center font-arabic text-xl mb-3 leading-loose">رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ</p>
                            <p className="text-center text-xs text-slate-400">"Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire."</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};