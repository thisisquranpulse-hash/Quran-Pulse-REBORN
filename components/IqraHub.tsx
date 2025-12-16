import React, { useState, useEffect } from 'react';
import { IqraLevel, IqraProgress, AudioLog } from '../types';
import { analyzeIqraReading } from '../services/geminiService';
import { getAllIqraProgress, saveIqraProgress, getIqraProgress } from '../services/iqraCache';

interface IqraHubProps {
    onLogUpdate: (log: AudioLog) => void;
}

const IQRA_LEVELS: IqraLevel[] = [
    { level: 1, title: 'Iqra 1', description: 'Pengenalan Huruf Tunggal', total_pages: 30, color: 'from-emerald-400 to-emerald-600' },
    { level: 2, title: 'Iqra 2', description: 'Huruf Bersambung', total_pages: 30, color: 'from-blue-400 to-blue-600' },
    { level: 3, title: 'Iqra 3', description: 'Harakat Panjang (Mad)', total_pages: 30, color: 'from-indigo-400 to-indigo-600' },
    { level: 4, title: 'Iqra 4', description: 'Tanwin & Qalqalah', total_pages: 30, color: 'from-purple-400 to-purple-600' },
    { level: 5, title: 'Iqra 5', description: 'Waqaf & Tajwid Asas', total_pages: 30, color: 'from-pink-400 to-pink-600' },
    { level: 6, title: 'Iqra 6', description: 'Bacaan Al-Quran Lancar', total_pages: 30, color: 'from-rose-400 to-rose-600' },
];

const MOCK_PAGES = [
    { id: 1, letters: ["ا", "ب", "ت", "ث"], expected: "Alif Ba Ta Tsa" },
    { id: 2, letters: ["ج", "ح", "خ", "د"], expected: "Jim Ha Kho Dal" },
    { id: 3, letters: ["ذ", "ر", "ز", "س"], expected: "Dzal Ro Zai Sin" },
    { id: 4, letters: ["ش", "ص", "ض", "ط"], expected: "Syin Sod Dhod Tho" },
];

export const IqraHub: React.FC<IqraHubProps> = ({ onLogUpdate }) => {
    const [selectedLevel, setSelectedLevel] = useState<IqraLevel | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // Progress State
    const [progressMap, setProgressMap] = useState<Record<number, IqraProgress>>({});

    useEffect(() => {
        refreshProgress();
    }, []);

    const refreshProgress = async () => {
        const all = await getAllIqraProgress();
        const map: Record<number, IqraProgress> = {};
        all.forEach(p => map[p.level] = p);
        setProgressMap(map);
    };

    const handleLevelSelect = async (lvl: IqraLevel) => {
        // Resume from last saved page
        const saved = progressMap[lvl.level];
        const startPage = saved ? Math.min(saved.completed_pages + 1, lvl.total_pages) : 1;
        
        setSelectedLevel(lvl);
        setCurrentPage(startPage);
        setFeedback(null);
    };

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
                
                // Get expected text
                const currentMock = MOCK_PAGES[Math.min(currentPage - 1, MOCK_PAGES.length - 1)];
                const expected = currentMock.expected;

                const result = await analyzeIqraReading(blob, expected, selectedLevel.level);
                setFeedback(result);
                
                // Save Logic
                if (result.is_correct) {
                    const currentProgress = progressMap[selectedLevel.level] || { 
                        level: selectedLevel.level, 
                        completed_pages: 0, 
                        accuracy: 0, 
                        last_updated: 0 
                    };

                    // Only advance pages if this page was the next one in line
                    const isNewPage = currentPage > currentProgress.completed_pages;
                    
                    const newCompleted = isNewPage ? currentPage : currentProgress.completed_pages;
                    
                    // Simple moving average for accuracy
                    const count = isNewPage ? currentPage : currentProgress.completed_pages || 1; 
                    const newAccuracy = Math.round(((currentProgress.accuracy * (count - 1)) + result.accuracy_score) / count);

                    const newProgress: IqraProgress = {
                        level: selectedLevel.level,
                        completed_pages: newCompleted,
                        accuracy: newAccuracy,
                        last_updated: Date.now()
                    };

                    await saveIqraProgress(newProgress);
                    await refreshProgress(); // Update UI
                }

                onLogUpdate({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'iqra_feedback',
                    userText: `Page ${currentPage} Attempt`,
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
            setFeedback(null);
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

    // Calculate percentage for list view
    const getProgressPct = (lvl: number, total: number) => {
        const p = progressMap[lvl];
        if (!p) return 0;
        return Math.min(100, Math.round((p.completed_pages / total) * 100));
    };

    if (selectedLevel) {
        return (
            <div className="h-full flex flex-col bg-background-dark text-white p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setSelectedLevel(null)} className="flex items-center text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined mr-1">arrow_back</span>
                        Back to Hub
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-xl text-white">{selectedLevel.title}</h2>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1">
                             <span>Page {currentPage} of {selectedLevel.total_pages}</span>
                             {progressMap[selectedLevel.level]?.accuracy > 0 && (
                                 <span className="bg-white/10 px-2 py-0.5 rounded text-emerald-400">
                                     Avg {progressMap[selectedLevel.level].accuracy}%
                                 </span>
                             )}
                        </div>
                    </div>
                    <div className="w-24"></div> 
                </div>

                {/* Reader Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    
                    {/* Progress Bar (Top of Reader) */}
                    <div className="w-full max-w-md h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${(currentPage / selectedLevel.total_pages) * 100}%` }}
                        ></div>
                    </div>

                    {/* Mock Book Content */}
                    <div className="bg-[#fdf6e3] text-black w-full max-w-md aspect-[3/4] rounded-lg shadow-2xl p-8 flex flex-col items-center justify-center border-l-4 border-[#e8dcc0] relative overflow-hidden transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-9xl">menu_book</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 z-10">
                            {MOCK_PAGES[Math.min(currentPage-1, MOCK_PAGES.length-1)].letters.map((l, i) => (
                                <div key={i} className="text-8xl font-arabic font-bold text-center border-b-2 border-black/10 pb-4">
                                    {l}
                                </div>
                            ))}
                        </div>
                        
                        <p className="mt-12 text-sm text-slate-500 font-mono">Baca dengan jelas</p>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                         <div className={`mt-6 p-4 rounded-xl border backdrop-blur-md ${feedback.is_correct ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-amber-500/10 border-amber-500/50'} max-w-md w-full animate-in fade-in slide-in-from-bottom-4 shadow-lg`}>
                             <div className="flex items-center justify-between mb-2">
                                 <h4 className={`font-bold ${feedback.is_correct ? 'text-emerald-400' : 'text-amber-400'}`}>
                                     {feedback.is_correct ? 'MashaAllah! Tepat.' : 'Cuba Lagi'}
                                 </h4>
                                 <span className={`text-xs font-mono px-2 py-1 rounded ${feedback.is_correct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>Score: {feedback.accuracy_score}%</span>
                             </div>
                             <p className="text-sm text-slate-200">{feedback.feedback_bm}</p>
                             
                             {feedback.is_correct && currentPage < selectedLevel.total_pages && (
                                 <button 
                                    onClick={() => {
                                        setCurrentPage(c => Math.min(c + 1, selectedLevel.total_pages));
                                        setFeedback(null);
                                    }}
                                    className="mt-3 w-full bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors"
                                 >
                                     Next Page
                                 </button>
                             )}
                         </div>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-8 flex items-center justify-center gap-8 pb-8">
                     <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="p-4 rounded-full bg-surface-card hover:bg-surface-hover text-white transition-colors border border-white/5">
                        <span className="material-symbols-outlined">chevron_left</span>
                     </button>

                     <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-neon transition-all transform hover:scale-105 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}
                     >
                        <span className="material-symbols-outlined text-4xl text-background-dark">
                            {isRecording ? 'stop' : (loading ? 'hourglass_empty' : 'mic')}
                        </span>
                     </button>

                     <button onClick={() => setCurrentPage(Math.min(selectedLevel.total_pages, currentPage + 1))} className="p-4 rounded-full bg-surface-card hover:bg-surface-hover text-white transition-colors border border-white/5">
                        <span className="material-symbols-outlined">chevron_right</span>
                     </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto no-scrollbar">
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">Iqra' Hub</h1>
                <p className="text-slate-400">Master the Quran from basics with AI Ustaz feedback.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {IQRA_LEVELS.map((lvl) => {
                    const pct = getProgressPct(lvl.level, lvl.total_pages);
                    const saved = progressMap[lvl.level];
                    const isStarted = saved && saved.completed_pages > 0;

                    return (
                        <button 
                            key={lvl.level}
                            onClick={() => handleLevelSelect(lvl)}
                            className="group relative overflow-hidden rounded-3xl p-6 bg-surface-card border border-white/5 hover:border-white/20 transition-all text-left shadow-lg hover:shadow-2xl hover:-translate-y-1"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${lvl.color} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`}></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${lvl.color} text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                                        Level {lvl.level}
                                    </span>
                                    {isStarted && (
                                        <div className="flex items-center gap-1 bg-background-dark/50 px-2 py-1 rounded-lg border border-white/5">
                                             <span className="text-[10px] text-emerald-400 font-bold">{saved.accuracy}%</span>
                                             <span className="material-symbols-outlined text-[10px] text-emerald-400">verified</span>
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold mb-1 text-white">{lvl.title}</h3>
                                <p className="text-sm text-slate-400 mb-6 line-clamp-2">{lvl.description}</p>
                                
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-slate-500">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">auto_stories</span> {saved?.completed_pages || 0}/{lvl.total_pages}</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${lvl.color} transition-all duration-700`} 
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};