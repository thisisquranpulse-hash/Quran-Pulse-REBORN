import React, { useState, useEffect } from 'react';
import { IqraLevel, IqraProgress, AudioLog } from '../types';
import { analyzeIqraReading, generateIqraPage } from '../services/geminiService';
import { getAllIqraProgress, saveIqraProgress } from '../services/iqraCache';

interface IqraHubProps {
    onLogUpdate: (log: AudioLog) => void;
}

const IQRA_LEVELS: IqraLevel[] = [
    { level: 1, title: 'Iqra 1', description: 'Pengenalan Huruf Tunggal (Fathah)', total_pages: 30, color: 'from-emerald-400 to-emerald-600' },
    { level: 2, title: 'Iqra 2', description: 'Huruf Bersambung & Bacaan Panjang', total_pages: 30, color: 'from-blue-400 to-blue-600' },
    { level: 3, title: 'Iqra 3', description: 'Kasrah, Dhommah & Mad Asli', total_pages: 30, color: 'from-indigo-400 to-indigo-600' },
    { level: 4, title: 'Iqra 4', description: 'Tanwin, Qalqalah & Sukun', total_pages: 30, color: 'from-purple-400 to-purple-600' },
    { level: 5, title: 'Iqra 5', description: 'Waqaf, Tasydid & Tajwid', total_pages: 30, color: 'from-pink-400 to-pink-600' },
    { level: 6, title: 'Iqra 6', description: 'Bacaan Al-Quran Berkelancaran', total_pages: 30, color: 'from-rose-400 to-rose-600' }
];

interface DigitalPage {
    id: number;
    level: number;
    rows: string[][]; 
    instruction: string;
    expectedText: string; 
}

// --- STATIC QUIZ DATA (Kept for Practice Mode) ---
interface Exercise {
    type: 'mcq' | 'voice';
    question: string;
    arabic: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string; 
}

const LEVEL_EXERCISES: Record<number, Exercise[]> = {
    1: [
        { type: 'mcq', question: "Which letter is this?", arabic: "بَ", options: ["Ba", "Ta", "Sa", "Alif"], correctAnswer: "Ba" },
        { type: 'voice', question: "Read this letter aloud:", arabic: "أَ", correctAnswer: "A" },
        { type: 'mcq', question: "What is the sound?", arabic: "جَ", options: ["Ja", "Ha", "Kho", "Jim"], correctAnswer: "Ja" },
        { type: 'voice', question: "Say this letter:", arabic: "سَ", correctAnswer: "Sa" },
        { type: 'mcq', question: "Identify this letter", arabic: "طَ", options: ["Tho", "Zho", "To", "Zo"], correctAnswer: "Tho" }
    ],
    2: [
        { type: 'mcq', question: "How to read this combination?", arabic: "بَدَ", options: ["Bada", "Daba", "Tada", "Baba"], correctAnswer: "Bada" },
        { type: 'voice', question: "Read this combined word:", arabic: "تَوَ", correctAnswer: "Tawa" },
        { type: 'mcq', question: "Identify the joined letters", arabic: "نَذَرَ", options: ["Nazaro", "Zanaro", "Ranaza", "Naraza"], correctAnswer: "Nazaro" },
        { type: 'mcq', question: "Read this", arabic: "سَكَتَ", options: ["Sakata", "Kasata", "Tasaka", "Kataba"], correctAnswer: "Sakata" }
    ],
    3: [
        { type: 'mcq', question: "This has Mad Asli. How many harakat?", arabic: "بَا", options: ["1 Harakat", "2 Harakat", "4 Harakat", "6 Harakat"], correctAnswer: "2 Harakat" },
        { type: 'voice', question: "Read with correct length (2 harakat):", arabic: "قَالَ", correctAnswer: "Qoola" },
        { type: 'mcq', question: "Which word is read long?", arabic: "قَالَ", options: ["Qola", "Qoola", "Qala", "Qula"], correctAnswer: "Qoola" },
        { type: 'mcq', question: "Identify the reading", arabic: "يَدَاهَا", options: ["Yadaha", "Yadaaha", "Yadahaa", "Yadaahaa"], correctAnswer: "Yadaaha" }
    ],
    4: [
        { type: 'mcq', question: "What is the vowel sound?", arabic: "بِ", options: ["Ba", "Bi", "Bu", "Be"], correctAnswer: "Bi" },
        { type: 'voice', question: "Read this Kasrah sound:", arabic: "تِي", correctAnswer: "Tii" },
        { type: 'mcq', question: "Identify the reading", arabic: "فِيْهِ", options: ["Fiihi", "Fihi", "Fihii", "Fih"], correctAnswer: "Fiihi" },
        { type: 'mcq', question: "Read with Dhommah", arabic: "كُتُبُ", options: ["Kataba", "Kutubu", "Kitabu", "Kutiba"], correctAnswer: "Kutubu" }
    ],
    5: [
        { type: 'mcq', question: "Mad Dhommah length?", arabic: "تُوْبُ", options: ["1", "2", "3", "4"], correctAnswer: "2" },
        { type: 'voice', question: "Read this Mad Dhommah:", arabic: "يَقُولُ", correctAnswer: "Yaqoolu" },
        { type: 'mcq', question: "How to read this?", arabic: "قَالُوْا", options: ["Qooluu", "Qolu", "Qoolu", "Qoluu"], correctAnswer: "Qooluu" },
        { type: 'mcq', question: "Identify Mad Shilah Qashirah", arabic: "إِنَّهُۥ", options: ["Innahu", "Innahuu", "Inhu", "Inna"], correctAnswer: "Innahuu" }
    ],
    6: [
        { 
            type: 'mcq', 
            question: "Qalqalah Rule: When do we bounce the sound?", 
            arabic: "ق ط b ج د", 
            options: ["When they have Fathah", "When they have Sukun (Stop)", "When they have Kasrah", "Always"], 
            correctAnswer: "When they have Sukun (Stop)",
            explanation: "Qalqalah (Bouncing) occurs when the letters Qaf, Tho, Ba, Jim, or Dal have a Sukun (mati) or when stopping."
        },
        { 
            type: 'voice', 
            question: "Practice Qalqalah Kubra (Strong Bounce) at the end:", 
            arabic: "ٱلْفَلَقِ", 
            correctAnswer: "Al-Falaq",
            explanation: "Bounce the Qaf strongly when stopping."
        },
        { 
            type: 'mcq', 
            question: "Which letter here requires Qalqalah?", 
            arabic: "يَدْخُلُونَ", 
            options: ["Ya", "Dal (Sukun)", "Kha", "Wau"], 
            correctAnswer: "Dal (Sukun)",
            explanation: "The Dal has a Sukun, so we apply Qalqalah Sugra (Minor Bounce)."
        },
        { 
            type: 'mcq', 
            question: "Tanwin sound?", 
            arabic: "بًا", 
            options: ["Ba", "Bi", "Ban", "Bun"], 
            correctAnswer: "Ban",
            explanation: "Fathatain (Double Fathah) creates the 'an' sound."
        },
        { 
            type: 'voice', 
            question: "Read the Tanwin:", 
            arabic: "أَحَدًا", 
            correctAnswer: "Ahadan",
            explanation: "Pronounce clearly: A-ha-dan."
        },
        { 
            type: 'mcq', 
            question: "Identify Qolqolah", 
            arabic: "أَبْ", 
            options: ["Ab (bounce)", "Ab (stop)", "Aba", "Abi"], 
            correctAnswer: "Ab (bounce)",
            explanation: "Ba is a Qalqalah letter. When it has sukun, we bounce it: 'Ab-ba'."
        },
        { 
            type: 'mcq', 
            question: "Read this sentence", 
            arabic: "عَلِيمٌ حَكِيمٌ", 
            options: ["Alimun Hakimun", "Aliman Hakiman", "Alimin Hakimin", "Alimu Hakimu"], 
            correctAnswer: "Alimun Hakimun"
        },
        {
            type: 'voice',
            question: "Pronounce with Qalqalah:",
            arabic: "أَطْعَمَهُم",
            correctAnswer: "Ath'amahum",
            explanation: "Tho (ط) is a Qalqalah letter. Bounce it: 'Ath-th'."
        }
    ]
};

// --- SKELETON COMPONENT ---
const LevelSkeleton = () => (
    <div className="rounded-3xl border border-white/10 bg-surface-card/20 p-6 h-48 animate-pulse flex flex-col justify-between">
        <div>
            <div className="w-12 h-12 rounded-xl bg-white/10 mb-4"></div>
            <div className="w-32 h-6 bg-white/10 rounded mb-2"></div>
            <div className="w-48 h-3 bg-white/5 rounded"></div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5"></div>
    </div>
);

export const IqraHub: React.FC<IqraHubProps> = ({ onLogUpdate }) => {
    // Navigation & Mode
    const [selectedLevel, setSelectedLevel] = useState<IqraLevel | null>(null);
    const [viewMode, setViewMode] = useState<'READ' | 'PRACTICE'>('READ');
    
    // Dynamic Page Content
    const [dynamicPage, setDynamicPage] = useState<DigitalPage | null>(null);
    const [generatingPage, setGeneratingPage] = useState(false);

    // Reading State
    const [currentPage, setCurrentPage] = useState(1);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // Quiz State
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
    const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

    // Progress State
    const [progressMap, setProgressMap] = useState<Record<number, IqraProgress>>({});
    const [loadingProgress, setLoadingProgress] = useState(true);

    // --- TASBIH STATE ---
    const [showTasbih, setShowTasbih] = useState(false);
    const [tasbihCount, setTasbihCount] = useState(() => {
        const saved = localStorage.getItem('pulse_tasbih_count');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [tasbihTarget, setTasbihTarget] = useState(33);

    // TASBIH EFFECT
    useEffect(() => {
        localStorage.setItem('pulse_tasbih_count', tasbihCount.toString());
    }, [tasbihCount]);

    useEffect(() => {
        refreshProgress();
    }, []);

    const refreshProgress = async () => {
        setLoadingProgress(true);
        const all = await getAllIqraProgress();
        const map: Record<number, IqraProgress> = {};
        all.forEach(p => map[p.level] = p);
        setProgressMap(map);
        setLoadingProgress(false);
    };

    const resetQuiz = () => {
        setQuizIndex(0);
        setQuizScore(0);
        setQuizCompleted(false);
        setSelectedOption(null);
        setIsAnswerCorrect(null);
        setQuizFeedback(null);
    };

    const loadDynamicContent = async (lvl: number, pageNum: number) => {
        setGeneratingPage(true);
        setDynamicPage(null);
        try {
            const content = await generateIqraPage(lvl);
            setDynamicPage({
                id: pageNum,
                level: lvl,
                instruction: content.instruction || `Practice Page ${pageNum}`,
                rows: content.rows || [],
                expectedText: content.expectedText || ""
            });
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingPage(false);
        }
    };

    const handleLevelSelect = async (lvl: IqraLevel) => {
        const saved = progressMap[lvl.level];
        
        let startPage = 1;
        if (saved) {
             startPage = saved.completed_pages + 1;
        }

        setSelectedLevel(lvl);
        setCurrentPage(startPage);
        setFeedback(null);
        setViewMode('READ'); 
        resetQuiz();

        // Load content for the "current" page immediately
        loadDynamicContent(lvl.level, startPage);
    };

    const handleTasbihClick = () => {
        setTasbihCount(prev => {
            const next = prev + 1;
            // Haptic Feedback
            if (navigator.vibrate) {
                if (next % tasbihTarget === 0) {
                    navigator.vibrate([50, 50, 50]); // Triple pulse on target
                } else {
                    navigator.vibrate(15); // Light tap
                }
            }
            return next;
        });
    };

    // --- READING & PRACTICE RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = async () => {
                if (!selectedLevel) return;

                const blob = new Blob(chunks, { type: 'audio/webm' });
                setLoading(true);
                
                let expectedText = "";
                // DETERMINE EXPECTED TEXT BASED ON MODE
                if (viewMode === 'READ') {
                    // Use the dynamically generated expected text
                    expectedText = dynamicPage?.expectedText || "Unknown";
                } else {
                    const exercises = LEVEL_EXERCISES[selectedLevel.level] || [];
                    const currentEx = exercises[quizIndex];
                    expectedText = currentEx.correctAnswer;
                }

                const result = await analyzeIqraReading(blob, expectedText, selectedLevel.level);
                
                if (viewMode === 'READ') {
                    setFeedback(result);
                    if (result.is_correct) {
                        const currentProgress = progressMap[selectedLevel.level] || { 
                            level: selectedLevel.level, 
                            completed_pages: 0, 
                            accuracy: 0, 
                            last_updated: 0 
                        };

                        const isNewPage = currentPage > currentProgress.completed_pages;
                        const newCompleted = isNewPage ? currentPage : currentProgress.completed_pages;
                        const count = isNewPage ? currentPage : currentProgress.completed_pages || 1; 
                        const newAccuracy = Math.round(((currentProgress.accuracy * (count - 1)) + result.accuracy_score) / count);

                        const newProgress: IqraProgress = {
                            level: selectedLevel.level,
                            completed_pages: newCompleted,
                            accuracy: newAccuracy,
                            last_updated: Date.now()
                        };

                        await saveIqraProgress(newProgress);
                        await refreshProgress(); 
                    }
                } else {
                    // --- PRACTICE MODE LOGIC ---
                    const exercises = LEVEL_EXERCISES[selectedLevel.level] || [];
                    const currentEx = exercises[quizIndex];
                    setIsAnswerCorrect(result.is_correct);
                    // Use explanation if available, otherwise AI feedback
                    setQuizFeedback(currentEx.explanation || result.feedback_bm);
                    if (result.is_correct) {
                        setQuizScore(s => s + 1);
                    }
                    
                    // Auto-advance logic for voice quiz
                    const delay = currentEx.explanation ? 5000 : 3500;
                    setTimeout(() => {
                        if (quizIndex < exercises.length - 1) {
                            setQuizIndex(prev => prev + 1);
                            setSelectedOption(null);
                            setIsAnswerCorrect(null);
                            setQuizFeedback(null);
                        } else {
                            setQuizCompleted(true);
                        }
                    }, delay); 
                }

                onLogUpdate({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'iqra_feedback',
                    userText: `Iqra Level ${selectedLevel.level} - ${viewMode === 'READ' ? 'Page ' + currentPage : 'Quiz Q' + (quizIndex + 1)}`,
                    aiText: result.feedback_bm,
                    audioUrl: URL.createObjectURL(blob),
                    metadata: { 
                        score: result.accuracy_score, 
                        level: selectedLevel.level, 
                        page: currentPage,
                        correct: result.is_correct 
                    }
                });
                
                setLoading(false);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            if (viewMode === 'READ') setFeedback(null);
        } catch (e) {
            console.error("Recording error", e);
            alert("Microphone access needed for AI Ustaz");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    // --- RENDER HELPERS ---
    const getProgressPct = (lvl: number, total: number) => {
        const p = progressMap[lvl];
        if (!p) return 0;
        return Math.min(100, Math.round((p.completed_pages / total) * 100));
    };

    // Navigation handlers
    const goToNextPage = () => {
        if (!selectedLevel) return;
        const nextId = currentPage + 1;
        setCurrentPage(nextId);
        setFeedback(null);
        loadDynamicContent(selectedLevel.level, nextId);
    };

    const goToPrevPage = () => {
        if (!selectedLevel) return;
        if (currentPage > 1) {
            const prevId = currentPage - 1;
            setCurrentPage(prevId);
            setFeedback(null);
            loadDynamicContent(selectedLevel.level, prevId);
        }
    };

    // --- RENDER VIEW 1: TASBIH MODE ---
    if (showTasbih) {
        return (
             <div className="h-full flex flex-col items-center justify-center p-6 relative bg-background-dark/0 text-white animate-in fade-in zoom-in-95 duration-300">
                {/* Back Button */}
                <div className="absolute top-0 left-0 p-6 w-full flex justify-between items-center z-10">
                    <button onClick={() => setShowTasbih(false)} className="flex items-center text-slate-400 hover:text-white transition-colors bg-surface-card border border-white/10 px-4 py-2 rounded-full">
                        <span className="material-symbols-outlined mr-2 text-sm">arrow_back</span>
                        <span className="text-xs font-bold uppercase">Back to Library</span>
                    </button>
                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Digital Tasbih
                    </div>
                </div>

                {/* Main Counter */}
                <div className="relative z-0 flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                        <button 
                            onClick={handleTasbihClick}
                            className="w-72 h-72 rounded-full bg-gradient-to-br from-surface-card to-background-dark border-8 border-surface-hover shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 group relative z-10"
                        >
                            <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 group-active:border-emerald-500/50 transition-colors"></div>
                            
                            <span className="text-9xl font-bold text-white font-mono tracking-tighter drop-shadow-2xl">{tasbihCount}</span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-[0.2em] mt-4 opacity-80 group-hover:opacity-100 transition-opacity">Tap to Count</span>
                        </button>
                    </div>

                    {/* Reset & Settings */}
                    <div className="flex items-center gap-8 mt-16">
                         <button 
                            onClick={() => { 
                                if(navigator.vibrate) navigator.vibrate(50);
                                setTasbihCount(0); 
                            }}
                            className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 flex items-center justify-center shadow-lg"
                            title="Reset Counter"
                         >
                             <span className="material-symbols-outlined text-2xl">restart_alt</span>
                         </button>
                         
                         <div className="flex items-center bg-surface-card rounded-full p-1.5 border border-white/10 shadow-lg">
                             {[33, 99, 100].map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setTasbihTarget(t)}
                                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all flex items-center justify-center ${tasbihTarget === t ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:text-white/5'}`}
                                 >
                                     {t}
                                 </button>
                             ))}
                         </div>
                    </div>
                    
                    <p className="mt-8 text-xs text-slate-500">Vibrates every {tasbihTarget} counts</p>
                </div>
             </div>
        );
    }

    // --- RENDER VIEW 2: SELECTED LEVEL ---
    if (selectedLevel) {
        const exercises = LEVEL_EXERCISES[selectedLevel.level] || [];
        const hasExercises = exercises.length > 0;

        return (
            <div className="h-full flex flex-col bg-background-dark/0 text-white p-4 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setSelectedLevel(null)} className="flex items-center text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
                        <span className="text-xs font-bold uppercase">Library</span>
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-xl text-white">{selectedLevel.title}</h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{viewMode === 'READ' ? 'Infinite Generator' : 'Practice Mode'}</p>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex bg-surface-card rounded-full p-1 border border-white/10">
                        <button 
                            onClick={() => setViewMode('READ')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'READ' ? 'bg-primary text-background-dark' : 'text-slate-400 hover:text-white'}`}
                        >
                            Read
                        </button>
                        <button 
                            onClick={() => { setViewMode('PRACTICE'); }}
                            disabled={!hasExercises}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!hasExercises ? 'opacity-50 cursor-not-allowed' : viewMode === 'PRACTICE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Practice
                        </button>
                    </div>
                </div>

                {/* --- DIGITAL BOOK READER MODE (DYNAMIC) --- */}
                {viewMode === 'READ' && (
                    <>
                        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pb-20">
                            
                            {/* Page Progress Indicator */}
                            <div className="w-full max-w-sm flex justify-between text-[10px] text-slate-500 mb-2 px-2">
                                <span>Practice Page {currentPage}</span>
                                <span>Level {selectedLevel.level}</span>
                            </div>
                            <div className="w-full max-w-sm h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${(currentPage / selectedLevel.total_pages) * 100}%` }}
                                ></div>
                            </div>

                            {/* THE BOOK PAGE (Paper Design) */}
                            {/* Replaced bg-[#fdf6e3] with bg-paper (Meteor #F7F2EB) */}
                            <div className="bg-paper text-black w-full max-w-md min-h-[500px] md:aspect-[3/4] rounded-sm shadow-[5px_5px_15px_rgba(0,0,0,0.5),-1px_-1px_2px_rgba(255,255,255,0.1)] flex flex-col relative overflow-hidden transition-all md:scale-100 border-r-4 md:border-r-8 border-[#E8DCC0]">
                                
                                {generatingPage ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                                        <div className="w-12 h-12 border-4 border-[#d33682] border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Generating Infinite Practice Page...</p>
                                        <p className="text-xs text-slate-400">AI is creating new {selectedLevel.title} exercises for you.</p>
                                    </div>
                                ) : dynamicPage ? (
                                    <>
                                        {/* Header / Instruction */}
                                        <div className="bg-[#EEE8D5] p-3 text-center border-b-2 border-dashed border-[#d33682]/20">
                                            <p className="text-xs font-serif text-slate-700 italic">{dynamicPage.instruction}</p>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="flex-1 p-4 md:p-6 flex flex-col justify-start items-center gap-4 md:gap-6 overflow-y-auto no-scrollbar" dir="rtl">
                                            {dynamicPage.rows.map((row, rIdx) => (
                                                <div key={rIdx} className="flex flex-row-reverse flex-wrap justify-center items-center gap-x-4 gap-y-2 md:gap-8 w-full border-b-2 border-dashed border-black/10 pb-4 md:pb-6 last:border-0 last:pb-0 min-h-[60px] md:min-h-[80px]">
                                                    {row.map((group, cIdx) => (
                                                        <div key={cIdx} className="font-arabic text-4xl sm:text-5xl md:text-6xl font-bold text-black drop-shadow-sm leading-relaxed hover:scale-110 transition-transform cursor-pointer hover:text-[#d33682] select-none text-center px-1 md:px-2 py-1">
                                                            {group}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Page Footer */}
                                        <div className="absolute bottom-1 left-0 w-full text-center bg-paper/90 pt-1 pb-2">
                                            <span className="text-[12px] text-black font-bold font-mono border border-black/20 rounded-full px-2 py-0.5">{currentPage}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <button onClick={() => loadDynamicContent(selectedLevel.level, currentPage)} className="text-sm text-slate-500 underline">Retry Generation</button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Disclaimer */}
                            <div className="mt-4 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg max-w-sm">
                                <span className="material-symbols-outlined text-blue-400 text-sm">auto_awesome</span>
                                <p className="text-[9px] text-blue-200 text-justify leading-tight">
                                    AI-Generated Content: Every page is unique and created on-the-fly to provide infinite practice material.
                                </p>
                            </div>

                            {/* Feedback Overlay */}
                            {feedback && (
                                <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 p-4 rounded-xl border backdrop-blur-md ${feedback.is_correct ? 'bg-emerald-500/95 border-emerald-500/50' : 'bg-amber-500/95 border-amber-500/50'} max-w-md w-[90%] animate-in fade-in slide-in-from-bottom-4 shadow-2xl z-20`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className={`font-bold ${feedback.is_correct ? 'text-white' : 'text-white'}`}>
                                            {feedback.is_correct ? 'MashaAllah! Tepat.' : 'Cuba Lagi'}
                                        </h4>
                                        <span className="text-xs font-mono px-2 py-1 rounded bg-black/20 text-white">Score: {feedback.accuracy_score}%</span>
                                    </div>
                                    <p className="text-sm text-white mb-2">{feedback.feedback_bm}</p>
                                    
                                    {feedback.is_correct && (
                                        <button 
                                            onClick={goToNextPage}
                                            className="w-full bg-white text-emerald-600 py-2 rounded-lg text-sm font-bold shadow-md"
                                        >
                                            Next Page
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sticky Bottom Controls */}
                        <div className="absolute bottom-6 left-0 w-full flex items-center justify-center gap-6 pointer-events-auto">
                            <button onClick={goToPrevPage} disabled={currentPage <= 1 || generatingPage} className="p-4 rounded-full bg-surface-card hover:bg-surface-hover text-white transition-colors border border-white/5 shadow-lg disabled:opacity-50">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={generatingPage}
                                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all transform hover:scale-105 border-4 border-background-dark ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'} ${generatingPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="material-symbols-outlined text-4xl text-background-dark">
                                    {isRecording ? 'stop' : (loading ? 'hourglass_empty' : 'mic')}
                                </span>
                            </button>

                            <button onClick={goToNextPage} disabled={generatingPage} className="p-4 rounded-full bg-surface-card hover:bg-surface-hover text-white transition-colors border border-white/5 shadow-lg disabled:opacity-50">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </>
                )}

                {/* --- PRACTICE/QUIZ MODE --- */}
                {viewMode === 'PRACTICE' && (
                    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                        {!hasExercises ? (
                             <div className="text-center text-slate-400">
                                 <span className="material-symbols-outlined text-4xl mb-2">construction</span>
                                 <p>Exercises coming soon for this level.</p>
                             </div>
                        ) : !quizCompleted ? (
                             <div className="w-full bg-surface-card border border-white/10 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300 relative">
                                  {/* Progress Header */}
                                  <div className="flex justify-between items-center mb-8">
                                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Question {quizIndex + 1}</span>
                                      <div className="flex gap-1">
                                           {exercises.map((_, i) => (
                                               <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i < quizIndex ? 'bg-emerald-500' : i === quizIndex ? 'bg-white' : 'bg-white/10'}`}></div>
                                           ))}
                                      </div>
                                  </div>

                                  {/* Question Display */}
                                  <div className="text-center mb-10">
                                       <h3 className="text-slate-300 text-lg mb-4 font-display">{exercises[quizIndex].question}</h3>
                                       <div className="text-8xl font-arabic font-bold text-white drop-shadow-lg mb-6 py-6 bg-background-dark/30 rounded-2xl border border-white/5">
                                           {exercises[quizIndex].arabic}
                                       </div>
                                       
                                       {/* Feedback Display for Voice and MCQ */}
                                       {quizFeedback && (
                                           <div className={`mt-4 p-3 rounded-xl border ${isAnswerCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' : 'bg-red-500/20 border-red-500/50 text-red-100'} animate-in fade-in slide-in-from-bottom-2`}>
                                               <div className="flex items-center justify-center gap-2 mb-1">
                                                   <span className="material-symbols-outlined">{isAnswerCorrect ? 'check_circle' : 'cancel'}</span>
                                                   <span className="font-bold">{isAnswerCorrect ? 'Correct!' : 'Incorrect'}</span>
                                               </div>
                                               <p className="text-sm">{quizFeedback}</p>
                                           </div>
                                       )}
                                  </div>

                                  {/* Interaction Area */}
                                  {exercises[quizIndex].type === 'mcq' ? (
                                      <div className="grid grid-cols-2 gap-4">
                                           {exercises[quizIndex].options?.map((opt, i) => {
                                               let btnClass = "bg-background-dark/50 border-white/10 hover:bg-white/5 hover:border-white/30 text-slate-200";
                                               if (selectedOption === opt) {
                                                   btnClass = isAnswerCorrect 
                                                    ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                                                    : "bg-red-500 text-white border-red-400";
                                               }
                                               return (
                                                   <button
                                                       key={i}
                                                       onClick={() => {
                                                            const currentQ = exercises[quizIndex];
                                                            const correct = opt === currentQ.correctAnswer;
                                                            setSelectedOption(opt);
                                                            setIsAnswerCorrect(correct);
                                                            
                                                            setQuizFeedback(currentQ.explanation || (correct ? "Correct!" : `Incorrect. The right answer is ${currentQ.correctAnswer}.`));
                                                            
                                                            if (correct) setQuizScore(s => s + 1);
                                                            
                                                            const delay = currentQ.explanation ? 4000 : 1500;
                                                            
                                                            setTimeout(() => {
                                                                if (quizIndex < exercises.length - 1) {
                                                                    setQuizIndex(prev => prev + 1);
                                                                    setSelectedOption(null);
                                                                    setIsAnswerCorrect(null);
                                                                    setQuizFeedback(null);
                                                                } else {
                                                                    setQuizCompleted(true);
                                                                }
                                                            }, delay);
                                                       }}
                                                       disabled={selectedOption !== null}
                                                       className={`p-4 rounded-xl border font-bold text-lg transition-all transform active:scale-95 ${btnClass}`}
                                                   >
                                                       {opt}
                                                   </button>
                                               )
                                           })}
                                      </div>
                                  ) : (
                                      // Voice Question Controls
                                      <div className="flex justify-center">
                                          <button 
                                              onClick={isRecording ? stopRecording : startRecording}
                                              disabled={loading || (quizFeedback !== null)}
                                              className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl transition-all transform ${isRecording ? 'bg-red-500 border-red-400 animate-pulse scale-110' : 'bg-primary border-primary-glow hover:scale-105'} ${loading ? 'opacity-50 cursor-wait' : ''}`}
                                          >
                                              {loading ? (
                                                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              ) : (
                                                  <span className="material-symbols-outlined text-5xl text-white">
                                                      {isRecording ? 'stop' : 'mic'}
                                                  </span>
                                              )}
                                          </button>
                                      </div>
                                  )}
                             </div>
                        ) : (
                             // Quiz Results
                             <div className="text-center w-full bg-surface-card border border-white/10 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300">
                                 <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                     <span className="material-symbols-outlined text-4xl text-emerald-400">emoji_events</span>
                                 </div>
                                 <h3 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h3>
                                 <p className="text-slate-400 mb-8">You scored {quizScore} out of {exercises.length}</p>
                                 <div className="flex flex-col gap-3">
                                     <button onClick={() => { setViewMode('READ'); }} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors">
                                         Back to Reading
                                     </button>
                                     <button onClick={resetQuiz} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg">
                                         Retry Quiz
                                     </button>
                                 </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    // --- RENDER VIEW 3: LEVEL SELECTION (MAIN) ---
    return (
        <div className="h-full overflow-y-auto no-scrollbar p-6">
             {/* Header */}
             <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Iqra' Library</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Master Quranic Literacy</p>
                 </div>
                 <button 
                    onClick={() => setShowTasbih(true)}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-5 py-2.5 rounded-full text-sm font-bold text-emerald-400 transition-all shadow-lg group"
                >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">fingerprint</span>
                    <span>Tasbih</span>
                </button>
             </div>
             
             {/* Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {loadingProgress 
                    ? Array.from({length: 6}).map((_, i) => <LevelSkeleton key={i} />)
                    : IQRA_LEVELS.map((level) => {
                     const pct = getProgressPct(level.level, level.total_pages);
                     return (
                         <div 
                             key={level.level}
                             onClick={() => handleLevelSelect(level)}
                             className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-card/40 hover:bg-surface-card hover:border-white/20 transition-all cursor-pointer shadow-lg p-6 flex flex-col justify-between h-48`}
                         >
                             <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${level.color} opacity-10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-500`}></div>
                             
                             <div>
                                 <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg group-hover:shadow-neon/50 transition-shadow`}>
                                     {level.level}
                                 </div>
                                 <h3 className="text-xl font-bold text-white mb-1">{level.title}</h3>
                                 <p className="text-xs text-slate-400 leading-relaxed">{level.description}</p>
                             </div>

                             <div className="w-full bg-black/20 rounded-full h-1.5 mt-4 overflow-hidden">
                                 <div className={`h-full bg-gradient-to-r ${level.color}`} style={{ width: `${pct}%` }}></div>
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
};