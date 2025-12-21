
import React, { useState, useEffect, useRef } from 'react';
import { IqraLevel, IqraProgress, AudioLog } from '../types';
import { analyzeIqraReading, decodeAudioData } from '../services/geminiService';
import { getAllIqraProgress, saveIqraProgress } from '../services/iqraCache';
import { getAudioByKey } from '../services/audioCache';
import { IQRA_CURRICULUM, DigitalPage } from '../services/iqraData';

interface IqraHubProps {
    onLogUpdate: (log: AudioLog) => void;
}

const IQRA_LEVELS: IqraLevel[] = [
    { level: 1, title: 'Iqra 1', description: 'Huruf Tunggal & Baris Fathah', total_pages: 30, color: 'from-emerald-400 to-emerald-600' },
    { level: 2, title: 'Iqra 2', description: 'Huruf Bersambung & Mad Asli', total_pages: 30, color: 'from-blue-400 to-blue-600' },
    { level: 3, title: 'Iqra 3', description: 'Kasrah, Dhommah & Vokal Panjang', total_pages: 30, color: 'from-indigo-400 to-indigo-600' },
    { level: 4, title: 'Iqra 4', description: 'Tanwin, Sukun & Qalqalah', total_pages: 30, color: 'from-purple-400 to-purple-600' },
    { level: 5, title: 'Iqra 5', description: 'Tasydid, Waqaf & Al-Shamsiyyah', total_pages: 30, color: 'from-pink-400 to-pink-600' },
    { level: 6, title: 'Iqra 6', description: 'Hukum Tajwid & Kelancaran Al-Quran', total_pages: 30, color: 'from-rose-400 to-rose-600' }
];

// --- PHONETIC MAPPING CONSTANTS ---

// 1. Letter Names (For standalone/unvowelled letters in Level 1)
const LETTER_NAMES: Record<string, string> = {
    "ا": "Alif", "ب": "Ba", "ت": "Ta", "ث": "Tsa", "ج": "Jim", "ح": "Ha", "خ": "Kho",
    "د": "Dal", "ذ": "Dzal", "ر": "Ro", "ز": "Zai", "س": "Sin", "ش": "Syin", "ص": "Sod",
    "ض": "Dhod", "ط": "Tho", "ظ": "Zho", "ع": "'Ain", "غ": "Ghoin", "ف": "Fa", "ق": "Qof",
    "ك": "Kaf", "ل": "Lam", "م": "Mim", "ن": "Nun", "و": "Wau", "هـ": "Ha", "ه": "Ha",
    "لا": "LamAlif", "ء": "Hamzah", "ي": "Ya", "أ": "Alif", "ى": "Alif", "ة": "Ta Marbutah"
};

// 2. Phonetic Sounds (For vowelled text/compounds)
const PHONETIC_BASE: Record<string, string> = {
    "ا": "a", "ب": "b", "ت": "t", "ث": "ts", "ج": "j", "ح": "h", "خ": "kh",
    "د": "d", "ذ": "dz", "ر": "r", "ز": "z", "س": "s", "ش": "sy", "ص": "sh",
    "ض": "dh", "ط": "th", "ظ": "zh", "ع": "'", "غ": "gh", "ف": "f", "ق": "q",
    "ك": "k", "ل": "l", "م": "m", "ن": "n", "و": "w", "هـ": "h", "ه": "h",
    "ي": "y", "أ": "a", "إ": "i", "آ": "aa", "ى": "a", "ء": "'", "ة": "t"
};

const VOWELS: Record<string, string> = {
    "َ": "a", "ِ": "i", "ُ": "u",
    "ً": "an", "ٍ": "in", "ٌ": "un",
    "ْ": "" // Sukun = silent
};

// --- ADVANCED IPA GENERATOR ---
const getIPA = (text: string) => {
    if (!text) return "";
    
    // Strategy 1: Check if it's a known single letter Name (no vowels)
    // We check if the text length is small and contains no vowels
    const hasVowels = /[\u064B-\u065F]/.test(text);
    if (!hasVowels && LETTER_NAMES[text]) {
        return `/${LETTER_NAMES[text]}/`;
    }

    // Strategy 2: Transliterate character by character
    let out = "";
    const len = text.length;
    for (let i = 0; i < len; i++) {
        const c = text[i];
        
        if (VOWELS[c] !== undefined) {
            out += VOWELS[c];
        } else if (c === 'ّ') { // Shaddah
            // Double the previous consonant if possible
            // We just grab the last char added to 'out' (which corresponds to the base char)
            // Note: simple doubling for visual hint
            if (out.length > 0) out += out.slice(-1);
        } else if (PHONETIC_BASE[c]) {
            // Handle special case: Alif following Fatha -> elongate 'a'
            if (c === 'ا' && out.endsWith('a')) {
                out += 'a'; 
            } 
            // Handle special case: Wau following Damma -> elongate 'u'
            else if (c === 'و' && out.endsWith('u')) {
                out += 'u';
            }
            // Handle special case: Ya following Kasra -> elongate 'i'
            else if (c === 'ي' && out.endsWith('i')) {
                out += 'i';
            }
            else {
                out += PHONETIC_BASE[c];
            }
        } else if (c === ' ') {
            out += ' ';
        }
    }
    
    return out ? `/${out}/` : "";
};

// --- RESPONSIVE GRID LAYOUT HELPER ---
const getResponsiveGridClass = (itemCount: number) => {
    // Single item - Centered, limited width for aesthetic
    if (itemCount === 1) return "grid-cols-1 max-w-[160px] mx-auto";
    
    // Two items - Side by side, limited width
    if (itemCount === 2) return "grid-cols-2 max-w-[320px] mx-auto";
    
    // Three items - Side by side standard
    if (itemCount === 3) return "grid-cols-3 max-w-[480px] mx-auto";
    
    // Four items - 2x2 grid on mobile, 4x1 on larger screens
    if (itemCount === 4) return "grid-cols-2 sm:grid-cols-4";
    
    // Five items - 3 columns on mobile (wrapping), 5 on larger screens
    if (itemCount === 5) return "grid-cols-3 sm:grid-cols-5";
    
    // Six items (if not split) - 3 columns on mobile, 6 on larger
    if (itemCount === 6) return "grid-cols-3 sm:grid-cols-6";
    
    // Seven+ items - 4 columns on mobile, full row on larger
    if (itemCount >= 7) return `grid-cols-4 sm:grid-cols-${Math.min(itemCount, 8)}`;
    
    return "grid-cols-4 sm:grid-cols-6"; // Fallback
};

// --- FONT SIZE HELPER ---
const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len <= 2) return "text-4xl sm:text-5xl md:text-6xl"; 
    if (len < 5) return "text-3xl sm:text-4xl md:text-5xl"; 
    if (len < 8) return "text-2xl sm:text-3xl md:text-4xl"; 
    return "text-xl sm:text-2xl md:text-3xl"; 
};

// --- COLOR MAPPING FOR CARDS ---
const ROW_COLORS = [
    "bg-[#FFC0CB] text-red-900 border-red-200", // Pink
    "bg-[#87CEEB] text-blue-900 border-blue-200", // Blue
    "bg-[#FFFFE0] text-yellow-900 border-yellow-200", // Yellow
    "bg-[#FFDAB9] text-orange-900 border-orange-200", // Orange
    "bg-[#98FB98] text-green-900 border-green-200", // Green
    "bg-[#E6E6FA] text-purple-900 border-purple-200", // Purple
];

export const IqraHub: React.FC<IqraHubProps> = ({ onLogUpdate }) => {
    const [selectedLevel, setSelectedLevel] = useState<IqraLevel | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [dynamicPage, setDynamicPage] = useState<DigitalPage | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [progressMap, setProgressMap] = useState<Record<number, IqraProgress>>({});
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [showIPA, setShowIPA] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => { 
        refreshProgress(); 
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    const refreshProgress = async () => {
        setLoadingProgress(true);
        const all = await getAllIqraProgress();
        const map: Record<number, IqraProgress> = {};
        all.forEach(p => map[p.level] = p);
        setProgressMap(map);
        setLoadingProgress(false);
    };

    const loadPage = (lvl: number, pageNum: number) => {
        const key = `${lvl}-${pageNum}`;
        if (IQRA_CURRICULUM[key]) {
            setDynamicPage(IQRA_CURRICULUM[key]);
            return;
        }
        setDynamicPage({
            level: lvl,
            page: pageNum,
            instruction: "Sila rujuk buku Iqra fizikal.",
            rows: [["TIADA DATA"]],
            expectedText: ""
        });
    };

    const handleLevelSelect = (lvl: IqraLevel) => {
        const saved = progressMap[lvl.level];
        // Start at saved progress OR page 1 if no progress
        let startPage = saved ? Math.min(lvl.total_pages, saved.completed_pages + 1) : 1;
        if (startPage < 1) startPage = 1; 
        setSelectedLevel(lvl);
        setCurrentPage(startPage);
        setFeedback(null);
        loadPage(lvl.level, startPage);
    };

    const savePagePosition = async (page: number) => {
        if (!selectedLevel) return;
        const pagesDone = page; 
        const current = progressMap[selectedLevel.level] || { 
            level: selectedLevel.level, 
            completed_pages: 0, 
            accuracy: 0, 
            last_updated: 0 
        };
        if (pagesDone > current.completed_pages) {
            const newProg: IqraProgress = {
                ...current,
                completed_pages: pagesDone,
                last_updated: Date.now()
            };
            setProgressMap(prev => ({...prev, [selectedLevel.level]: newProg}));
            await saveIqraProgress(newProg);
        }
    };

    const playLetterSound = async (text: string) => {
        // Fallback label generation using LETTER_NAMES or simple mapping for caching keys
        const label = LETTER_NAMES[text] || text; 
        try {
            window.speechSynthesis.cancel();
            const isArabicScript = /[\u0600-\u06FF]/.test(text);
            const utterance = new SpeechSynthesisUtterance(isArabicScript ? text : label);
            utterance.lang = isArabicScript ? 'ar-SA' : 'id-ID'; 
            utterance.rate = 0.9; 
            window.speechSynthesis.speak(utterance);

            const cached = await getAudioByKey(`iqra_${label}`);
            if (cached && audioContextRef.current) {
                window.speechSynthesis.cancel();
                if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
                const audioBuffer = await decodeAudioData(cached.audio, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
            }
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    const playSuccessSound = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime;
        
        // Gentle "Ding" - C Major Chord (C5, E5, G5, C6) with soft envelope
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = f;
            osc.type = 'sine';
            
            // Envelope: Fast attack, slow exponential decay
            const volume = 0.03;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(volume, t + 0.02); 
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 + (i * 0.1));
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 1.0);
        });
    };

    const playErrorSound = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const t = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Soft "Buzz" / "Bonk" - Triangle wave, low pitch, pitch drop
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.2);
        osc.type = 'triangle'; // Softer than sawtooth
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = async () => {
                if (!selectedLevel || !dynamicPage) return;
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setLoading(true);
                const result = await analyzeIqraReading(blob, dynamicPage.expectedText, selectedLevel.level);
                setFeedback(result);
                if (result.is_correct) playSuccessSound(); else playErrorSound();
                onLogUpdate({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'iqra_feedback',
                    userText: `Iqra Level ${selectedLevel.level} Page ${currentPage}`,
                    aiText: `Score: ${result.accuracy_score}%. ${result.feedback_bm}`,
                    metadata: { correct: result.is_correct }
                });
                if (result.is_correct) savePagePosition(currentPage);
                setLoading(false);
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setFeedback(null);
        } catch (e) { alert("Microphone access required."); }
    };

    const stopRecording = () => mediaRecorder?.stop();
    
    const goToNextPage = () => { 
        if (selectedLevel) { 
            const n = currentPage + 1; 
            setCurrentPage(n); 
            setFeedback(null); 
            loadPage(selectedLevel.level, n);
        } 
    };
    
    const goToPrevPage = () => { 
        if (selectedLevel && currentPage > 1) { 
            const p = currentPage - 1; 
            setCurrentPage(p); 
            setFeedback(null); 
            loadPage(selectedLevel.level, p);
        } 
    };

    // Component for Individual Button/Card
    const LetterButton = ({ text, colorClass }: { text: string, colorClass: string }) => (
        <button
            onClick={() => playLetterSound(text)}
            className={`relative w-full flex flex-col items-center justify-center min-h-[60px] md:min-h-[80px] rounded-xl border-b-[3px] transition-all duration-150 active:scale-95 active:border-b-0 active:translate-y-1 px-1 py-1 ${colorClass} border-black/10 hover:brightness-95 shadow-sm`}
        >
            <span className={`font-arabic font-bold text-center leading-normal drop-shadow-sm w-full break-words ${getFontSizeClass(text)}`}>
                {text}
            </span>
            
            {showIPA && (
                <div dir="ltr" className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-mono text-slate-500/80 font-bold px-1 rounded bg-white/40 backdrop-blur-sm shadow-sm whitespace-nowrap">
                    {getIPA(text)}
                </div>
            )}
        </button>
    );

    if (selectedLevel) {
        return (
            <div className="fixed inset-0 z-[100] bg-background-dark text-white flex flex-col animate-in fade-in duration-300">
                
                {/* COMPACT HEADER (Fixed Top) */}
                <div className="h-14 px-4 flex items-center justify-between bg-surface-dark/95 backdrop-blur-xl border-b border-white/5 z-20 shrink-0 shadow-md">
                    <button 
                        onClick={() => setSelectedLevel(null)} 
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center border border-white/5">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Tutup</span>
                    </button>
                    
                    <h2 className="text-sm md:text-base font-display font-bold text-white tracking-wide absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {selectedLevel.title}
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className="text-slate-400 font-normal">Pg {currentPage}</span>
                    </h2>

                    <button 
                        onClick={() => setShowIPA(!showIPA)} 
                        className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${showIPA ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                        <span>IPA</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${showIPA ? 'bg-background-dark animate-pulse' : 'bg-slate-500'}`}></span>
                    </button>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background-dark to-surface-dark">
                    
                    {/* CARD CONTAINER */}
                    <div className="w-full max-w-2xl bg-[#FDFBF7] text-[#1a1a1a] rounded-[24px] shadow-2xl flex flex-col relative overflow-hidden border-l-[6px] border-l-[#E2D5C0] border-y border-r border-[#F0E6D2] h-full max-h-[75vh] animate-in zoom-in-95 duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10"></div>
                        
                        {dynamicPage ? (
                            <>
                                {/* Instruction Strip */}
                                <div className="bg-[#F4EFE6] px-4 py-2 text-center border-b border-[#E6DCC8] shrink-0">
                                    <p className="text-[10px] md:text-xs font-serif text-slate-700 font-semibold leading-relaxed italic line-clamp-1">"{dynamicPage.instruction}"</p>
                                </div>

                                {/* Scrollable Grid Area */}
                                <div className="flex-1 p-3 md:p-6 flex flex-col overflow-y-auto no-scrollbar" dir="rtl">
                                    <div className="flex justify-center mb-4 opacity-40 shrink-0">
                                        <span className="font-arabic text-sm">بسم الله الرحمن الرحيم</span>
                                    </div>

                                    <div className="space-y-6 pb-20">
                                        {dynamicPage.rows.map((row, rIdx) => {
                                            // Handle "Kotak Kanan" vs "Kotak Kiri" layout for 6-item rows
                                            const isSplitBox = row.length === 6;
                                            const colorClass = ROW_COLORS[rIdx % ROW_COLORS.length];

                                            if (isSplitBox) {
                                                const rightBox = row.slice(0, 3);
                                                const leftBox = row.slice(3, 6);
                                                return (
                                                    <div key={rIdx} className="w-full flex flex-col sm:flex-row items-stretch justify-between gap-3 border-b border-dashed border-[#D4C5A9] pb-4 last:border-0 relative group">
                                                        <div className="absolute -right-2 top-2 sm:top-1/2 -translate-y-1/2 text-[8px] text-[#D4C5A9] font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none pointer-events-none">{rIdx + 1}</div>
                                                        
                                                        {/* Right Box (Mula) Container */}
                                                        <div className="flex-1 bg-white/50 rounded-lg p-2 border border-[#E6DCC8]">
                                                            <div className="text-[8px] text-slate-400 font-bold mb-2 text-center uppercase tracking-widest opacity-50">Kanan (Mula)</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {rightBox.map((text, i) => (
                                                                    <LetterButton key={`r-${i}`} text={text} colorClass={colorClass} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Visual Separator - Hidden on mobile, visible on desktop */}
                                                        <div className="hidden sm:flex items-center justify-center opacity-30">
                                                            <div className="h-full w-px bg-[#D4C5A9] border-r border-dashed border-white"></div>
                                                        </div>

                                                        {/* Left Box Container */}
                                                        <div className="flex-1 bg-white/50 rounded-lg p-2 border border-[#E6DCC8]">
                                                            <div className="text-[8px] text-slate-400 font-bold mb-2 text-center uppercase tracking-widest opacity-50">Kiri</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {leftBox.map((text, i) => (
                                                                    <LetterButton key={`l-${i}`} text={text} colorClass={colorClass} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Responsive Grid Layout
                                            const gridClass = getResponsiveGridClass(row.length);
                                            return (
                                                <div 
                                                    key={rIdx} 
                                                    className={`grid gap-3 items-stretch w-full border-b border-dashed border-[#D4C5A9] pb-4 last:border-0 relative group ${gridClass}`}
                                                >
                                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[8px] text-[#D4C5A9] font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none left-0 text-left pointer-events-none">{rIdx + 1}</div>
                                                    {row.map((text, cIdx) => (
                                                        <LetterButton key={cIdx} text={text} colorClass={colorClass} />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                <p className="text-xs text-slate-500">Halaman ini belum tersedia.</p>
                            </div>
                        )}
                    </div>

                    {/* FEEDBACK POPUP (Absolute over card) */}
                    {feedback && (
                        <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 p-4 rounded-[20px] border backdrop-blur-3xl ${feedback.is_correct ? 'bg-emerald-600/90 border-emerald-400' : 'bg-amber-600/90 border-amber-400'} max-w-sm w-[90%] animate-in slide-in-from-bottom-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-30`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-white text-lg">{feedback.is_correct ? 'check_circle' : 'help_outline'}</span>
                                    <h4 className="font-bold text-white uppercase tracking-widest text-[10px]">{feedback.is_correct ? 'Cemerlang!' : 'Cuba Lagi'}</h4>
                                </div>
                                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">SKOR: {feedback.accuracy_score}%</span>
                            </div>
                            <p className="text-[10px] text-white/95 leading-relaxed mb-3 font-medium">{feedback.feedback_bm}</p>
                            {feedback.is_correct && (
                                <button onClick={goToNextPage} className="w-full bg-white text-emerald-900 py-2.5 rounded-lg text-[10px] font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    Teruskan <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTTOM CONTROLS (Floating) */}
                <div className="p-4 w-full flex justify-center shrink-0 z-30 pb-8 sm:pb-6">
                    <div className="flex items-center gap-2 bg-surface-card/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <button 
                            onClick={goToPrevPage} 
                            disabled={currentPage <= 1} 
                            className="w-10 h-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1"></div>

                        <div className="relative">
                             {isRecording && <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>}
                             <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                disabled={loading} 
                                className={`h-12 px-6 rounded-full flex items-center gap-2 transition-all transform active:scale-95 shadow-lg ${
                                    isRecording 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-primary text-background-dark hover:bg-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{isRecording ? 'stop_circle' : (loading ? 'hourglass_top' : 'mic')}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{isRecording ? 'Berhenti' : 'Semak'}</span>
                            </button>
                        </div>

                        <div className="h-6 w-px bg-white/10 mx-1"></div>

                        <button 
                            onClick={goToNextPage} 
                            disabled={!selectedLevel} 
                            className="w-10 h-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full overflow-y-auto no-scrollbar p-6 sm:p-10 animate-fade-in-up">
             <div className="max-w-6xl mx-auto mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                 <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">Iqra' Hub</h2>
                    <p className="text-[10px] sm:text-xs text-primary font-bold uppercase tracking-[0.4em] mt-4 flex items-center gap-3"><span className="w-10 h-[1px] bg-primary"></span>Asas Pembacaan Al-Quran Tradisional</p>
                 </div>
                 <div className="p-5 bg-surface-card rounded-[32px] border border-white/10 shadow-glow"><span className="material-symbols-outlined text-5xl text-primary animate-pulse">auto_stories</span></div>
             </div>
             <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                 {loadingProgress 
                    ? [...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-[48px] bg-white/5 animate-pulse border border-white/5"></div>)
                    : IQRA_LEVELS.map((level) => {
                     const p = progressMap[level.level];
                     const pct = p ? Math.min(100, Math.round((p.completed_pages / level.total_pages) * 100)) : 0;
                     const isCompleted = pct >= 100;
                     return (
                         <div key={level.level} onClick={() => handleLevelSelect(level)} className="group relative overflow-hidden rounded-[48px] border border-white/5 bg-surface-card/40 hover:bg-surface-card hover:border-primary/50 transition-all cursor-pointer shadow-2xl p-10 flex flex-col justify-between h-72 md:h-80">
                             <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${level.color} opacity-[0.03] group-hover:opacity-1 rounded-bl-[120px] pointer-events-none group-hover:scale-150 transition-all duration-1000`}></div>
                             <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-8">
                                     <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-3xl md:text-4xl shadow-2xl group-hover:shadow-neon/60 transition-all transform group-hover:-rotate-12`}>
                                        {level.level}
                                     </div>
                                     {/* VISUAL INDICATOR: PAGE COUNT */}
                                     <div className="flex flex-col items-end">
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Progress</span>
                                         <div className="flex items-baseline gap-1">
                                            <span className={`text-2xl font-bold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                                {p?.completed_pages || 0}
                                            </span>
                                            <span className="text-sm text-slate-500 font-medium">
                                                / {level.total_pages}
                                            </span>
                                         </div>
                                     </div>
                                 </div>
                                 <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">{level.title}</h3>
                                 <p className="text-xs md:text-sm text-slate-400 font-light leading-relaxed line-clamp-2">{level.description}</p>
                             </div>
                             <div className="relative z-10 w-full">
                                 <div className="flex justify-between items-end mb-3"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isCompleted ? 'Tahniah!' : 'Status'}</span><span className={`text-xs font-bold ${isCompleted ? 'text-emerald-400' : 'text-primary'}`}>{pct}%</span></div>
                                 <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5"><div className={`h-full bg-gradient-to-r ${level.color} shadow-neon transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div></div>
                             </div>
                             {isCompleted && (<div className="absolute top-8 right-1/2 translate-x-1/2 opacity-10 scale-[3] pointer-events-none"><span className="material-symbols-outlined text-emerald-400 text-9xl">stars</span></div>)}
                         </div>
                     );
                 })}
             </div>
        </div>
    );
};
