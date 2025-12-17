import React, { useEffect, useState, useMemo } from 'react';
import { getPrayerTimes, getQiblaDirection } from '../services/prayerApi';
import { identifyLocation } from '../services/geminiService';
import { PrayerTimes } from '../types';

// --- VISUAL ASSETS (SVG Components) ---

const Cloud: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <svg viewBox="0 0 24 24" className={`absolute fill-current ${className}`} style={style}>
        <path d="M18.5,12c-0.4,0-0.8,0.1-1.2,0.2C16.9,10.2,14.7,9,12.5,9c-3.1,0-5.7,2.2-6.3,5.1C6,14,5.8,14,5.5,14c-1.9,0-3.5,1.6-3.5,3.5 S3.6,21,5.5,21h13c1.9,0,3.5-1.6,3.5-3.5S20.4,12,18.5,12z"/>
    </svg>
);

const Star: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <div className="absolute bg-white rounded-full animate-pulse" style={{ ...style, width: Math.random() * 2 + 1 + 'px', height: Math.random() * 2 + 1 + 'px', opacity: Math.random() * 0.7 + 0.3 }} />
);

const Mountain: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 1440 320" className={`absolute bottom-0 w-full h-auto ${className}`} preserveAspectRatio="none">
        <path fill="currentColor" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
);

const Moon: React.FC = () => (
    <div className="absolute top-8 right-8 w-16 h-16 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] opacity-80">
        <div className="w-full h-full rounded-full bg-transparent shadow-[-10px_8px_0_2px_#ffffff] rotate-[-20deg]"></div>
    </div>
);

const Sun: React.FC = () => (
    <div className="absolute top-6 right-8 w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-[0_0_60px_rgba(253,186,116,0.6)] animate-pulse"></div>
);

export const PrayerDashboard: React.FC = () => {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [qibla, setQibla] = useState<number>(292); 
    const [heading, setHeading] = useState<number>(0);
    const [nextPrayerName, setNextPrayerName] = useState<string>('');
    const [currentPrayerName, setCurrentPrayerName] = useState<string>('');
    const [timeToNext, setTimeToNext] = useState<string>('');
    const [progressPct, setProgressPct] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Location & Mosque State
    const [locationName, setLocationName] = useState("Locating...");
    const [nearbyMosques, setNearbyMosques] = useState<any[]>([]);
    const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserCoords({ lat: latitude, lng: longitude });

            const times = await getPrayerTimes(latitude, longitude);
            setPrayerTimes(times);
            if (times) calculateNextPrayer(times);

            const qDir = await getQiblaDirection(latitude, longitude);
            setQibla(qDir);

            const locData = await identifyLocation(latitude, longitude);
            const locMatch = locData.text.match(/LOCATION:\s*(.*)/i);
            if (locMatch && locMatch[1]) {
                setLocationName(locMatch[1].trim());
            } else {
                setLocationName("Malaysia");
            }

            const mosques = locData.chunks?.filter(c => c.maps).map(c => ({
                title: c.maps?.title,
                uri: c.maps?.uri
            })) || [];
            
            const uniqueMosques = Array.from(new Map(mosques.map(item => [item.title, item])).values()).slice(0, 4);
            setNearbyMosques(uniqueMosques);

        }, (err) => {
            console.error("Loc error", err);
            getPrayerTimes(3.1390, 101.6869).then(t => {
                setPrayerTimes(t);
                if(t) calculateNextPrayer(t);
            });
            setLocationName("Kuala Lumpur");
        });

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha) setHeading(360 - event.alpha); 
        };
        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    useEffect(() => {
        if (!prayerTimes) return;
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            calculateNextPrayer(prayerTimes);
        }, 10000); 
        return () => clearInterval(interval);
    }, [prayerTimes]);

    const calculateNextPrayer = (times: PrayerTimes) => {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const prayers = [
            { name: 'Fajr', time: times.fajr },
            { name: 'Syuruk', time: times.sunrise },
            { name: 'Dhuhr', time: times.dhuhr },
            { name: 'Asr', time: times.asr },
            { name: 'Maghrib', time: times.maghrib },
            { name: 'Isha', time: times.isha },
        ];

        let next = null;
        let current = null;

        for (let i = 0; i < prayers.length; i++) {
            const p = prayers[i];
            const [h, m] = p.time.split(':').map(Number);
            const pMins = h * 60 + m;
            
            if (pMins > currentMins) {
                next = p;
                current = i > 0 ? prayers[i-1] : prayers[prayers.length - 1];
                if (i === 0) current = prayers[prayers.length - 1];
                break;
            }
        }

        if (!next) {
            next = prayers[0];
            current = prayers[prayers.length - 1];
        }

        setNextPrayerName(next.name);
        setCurrentPrayerName(current.name);
        
        const [hNext, mNext] = next.time.split(':').map(Number);
        let nextMins = hNext * 60 + mNext;
        const [hCurr, mCurr] = current.time.split(':').map(Number);
        let currMins = hCurr * 60 + mCurr;

        let nowMinsAdjusted = currentMins;
        if (nextMins < currMins) {
             nextMins += 24 * 60;
             if (nowMinsAdjusted < currMins) nowMinsAdjusted += 24 * 60;
        } else if (nowMinsAdjusted < currMins) {
            nowMinsAdjusted += 24 * 60;
        }

        const diff = nextMins - nowMinsAdjusted;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        
        if (hrs > 0) setTimeToNext(`${hrs}h ${mins}m`);
        else setTimeToNext(`${mins}m`);

        const totalDuration = nextMins - currMins;
        const elapsed = nowMinsAdjusted - currMins;
        const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        setProgressPct(pct);
    };

    const skyPhase = useMemo(() => {
        if (!prayerTimes) return 'night';
        const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        
        const getMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        }

        const fajr = getMins(prayerTimes.fajr);
        const sunrise = getMins(prayerTimes.sunrise);
        const maghrib = getMins(prayerTimes.maghrib);
        const isha = getMins(prayerTimes.isha);

        if (nowMins >= fajr && nowMins < sunrise) return 'dawn';
        if (nowMins >= sunrise && nowMins < maghrib) return 'day';
        if (nowMins >= maghrib && nowMins < isha) return 'dusk';
        return 'night';
    }, [prayerTimes, currentTime]);

    const stars = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => ({
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`
        }));
    }, []);

    if (!prayerTimes) return <div className="p-8 text-center text-primary animate-pulse">Synchronizing Time...</div>;

    const cards = [
        { name: 'Fajr', time: prayerTimes.fajr, icon: 'wb_twilight' },
        { name: 'Syuruk', time: prayerTimes.sunrise, icon: 'water_lux' },
        { name: 'Dhuhr', time: prayerTimes.dhuhr, icon: 'light_mode' },
        { name: 'Asr', time: prayerTimes.asr, icon: 'wb_sunny' },
        { name: 'Maghrib', time: prayerTimes.maghrib, icon: 'nights_stay' },
        { name: 'Isha', time: prayerTimes.isha, icon: 'dark_mode' },
    ];

    return (
        <div className="w-full space-y-6">
            
            {/* --- DYNAMIC SKY HERO CARD (Planetary Palette) --- */}
            <div className={`relative w-full h-[320px] rounded-[40px] overflow-hidden shadow-2xl transition-all duration-1000 group border border-white/5
                ${skyPhase === 'night' ? 'bg-gradient-to-b from-[#081F5C] via-[#0D2566] to-[#1E3A75]' : ''} /* Galaxy to Surface */
                ${skyPhase === 'dawn' ? 'bg-gradient-to-b from-[#0D2566] via-[#1E3A75] to-[#7096D1]' : ''} /* Surface to Universe */
                ${skyPhase === 'day' ? 'bg-gradient-to-b from-[#7096D1] to-[#BAD6EB]' : ''} /* Universe to Venus */
                ${skyPhase === 'dusk' ? 'bg-gradient-to-b from-[#1E3A75] via-[#081F5C] to-[#334EAC]' : ''} /* Surface to Planetary */
            `}>
                
                {/* Elements */}
                {(skyPhase !== 'day') && stars.map((s, i) => (
                    <Star key={i} style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
                ))}
                {(skyPhase === 'night' || skyPhase === 'dawn') && <Moon />}
                {(skyPhase === 'day' || skyPhase === 'dusk') && <Sun />}

                <Mountain className={`${skyPhase === 'day' ? 'text-[#D0E3FF]' : 'text-[#1E3A75]'} opacity-50 bottom-0`} />
                <Mountain className={`${skyPhase === 'day' ? 'text-[#BAD6EB]' : 'text-[#0D2566]'} opacity-80 bottom-[-20px] scale-110`} />
                <Mountain className={`${skyPhase === 'day' ? 'text-[#7096D1]' : 'text-[#081F5C]'} opacity-100 bottom-[-40px] scale-125`} />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            {/* Status Chip */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 mb-4 shadow-sm">
                                <span className={`w-2 h-2 rounded-full ${skyPhase === 'day' ? 'bg-yellow-400' : 'bg-primary'} animate-pulse`}></span>
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest">{skyPhase.toUpperCase()} VIEW</span>
                            </div>
                            
                            {/* Main Countdown */}
                            <div className="space-y-1">
                                <h2 className="text-6xl font-bold text-white drop-shadow-md tracking-tight">{nextPrayerName}</h2>
                                <p className="text-xl text-primary font-medium opacity-90">in {timeToNext}</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6 w-full max-w-[200px] space-y-2">
                                <div className="flex justify-between text-[10px] text-primary font-bold uppercase tracking-wider">
                                    <span>{currentPrayerName}</span>
                                    <span>{Math.round(progressPct)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary shadow-[0_0_10px_#BAD6EB] transition-all duration-1000 ease-out" 
                                        style={{ width: `${progressPct}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Qibla Widget */}
                        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform bg-white/5">
                             <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                                <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                                <div className="absolute inset-0 border-2 border-white/60 rounded-full border-t-transparent animate-spin duration-[3000ms]"></div>
                                <div 
                                    className="w-0.5 h-8 bg-primary rounded-full origin-bottom absolute bottom-1/2 left-1/2 -translate-x-1/2 transition-transform duration-700"
                                    style={{ transform: `translateX(-50%) rotate(${qibla - heading}deg)` }}
                                ></div>
                             </div>
                             <span className="text-[10px] font-bold text-white tracking-wider">QIBLA</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                         <div>
                            <p className="text-5xl font-light text-white font-display opacity-90 tracking-tighter">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-primary uppercase tracking-widest mt-1 font-bold opacity-80">{prayerTimes.date}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm text-primary font-arabic bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                                {prayerTimes.hijri}
                            </p>
                         </div>
                    </div>
                </div>
            </div>

            {/* --- LOCATION & MOSQUE FINDER --- */}
            <div className="w-full glass-panel rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-lg bg-surface-card/40">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary/5 to-transparent"></div>
                
                <div className="flex-1 space-y-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-lg animate-bounce">location_on</span>
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">GPS Location</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white leading-tight">
                            Current Location: <span className="text-primary">{locationName}</span>
                        </h3>
                    </div>

                    <div className="flex gap-3 pt-2">
                         <a 
                            href={`https://www.google.com/maps/search/?api=1&query=masjid&center=${userCoords?.lat},${userCoords?.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-primary text-background-dark px-6 py-3 rounded-full font-bold text-sm shadow-neon flex items-center gap-2 hover:bg-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">map</span>
                            Find Mosques
                        </a>
                    </div>
                </div>

                <div className="flex-1 border-l border-white/10 pl-0 md:pl-6 relative z-10">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3">Nearby (10km)</p>
                    <div className="space-y-2">
                        {nearbyMosques.length > 0 ? nearbyMosques.map((m, i) => (
                            <a 
                                key={i} 
                                href={m.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-background-dark/30 border border-white/5 hover:border-primary/50 hover:bg-background-dark transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                                        <span className="material-symbols-outlined text-sm">mosque</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white truncate max-w-[150px]">{m.title}</span>
                                </div>
                                <span className="material-symbols-outlined text-secondary text-sm group-hover:text-primary">arrow_outward</span>
                            </a>
                        )) : (
                            <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                                <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                                Finding nearby mosques...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- PRAYER GRID --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map((p) => {
                    const isNext = p.name === nextPrayerName;
                    const isCurrent = p.name === currentPrayerName;
                    
                    return (
                        <div 
                            key={p.name} 
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all relative overflow-hidden group h-32
                                ${isNext 
                                    ? 'bg-primary text-background-dark border-primary shadow-neon transform scale-105 z-10' 
                                    : isCurrent 
                                        ? 'bg-surface-card border-primary/50 text-white'
                                        : 'bg-surface-card/30 border-white/5 text-slate-400 hover:bg-surface-card hover:text-white'
                                }`}
                        >
                            {(isNext || isCurrent) && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}

                            <span className={`material-symbols-outlined mb-2 text-2xl relative z-10 ${isNext ? 'scale-110' : ''}`}>{p.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider mb-1 relative z-10 opacity-80">{p.name}</span>
                            <span className={`text-sm font-mono font-bold relative z-10 ${isNext ? 'text-background-dark' : isCurrent ? 'text-white' : 'text-slate-300'}`}>{p.time}</span>
                            
                            {isNext && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-background-dark/50"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};