import React, { useEffect, useState, useRef } from 'react';
import { Surah, Verse, Juz, AudioLog } from '../types';
import { fetchChapters, fetchVerses, fetchJuzs, fetchVersesByJuz, fetchRecitationAudio, RECITERS } from '../services/quranApi';
import { generateMalaySpeech, decodeAudioData, generateVerseInsight } from '../services/geminiService';
import { getAudio, saveAudio } from '../services/audioCache';
import { UnifiedAssistant } from './UnifiedAssistant';
import { Bismillah } from './Bismillah';

interface QuranReaderProps {
  onLogUpdate: (log: AudioLog) => void;
}

type ListMode = 'SURAH' | 'JUZ' | 'REVELATION';

// --- SKELETON COMPONENTS ---
const ChapterSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-surface-card/20 animate-pulse h-[88px]">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10"></div>
            <div className="space-y-2">
                <div className="w-32 h-4 bg-white/10 rounded"></div>
                <div className="w-20 h-3 bg-white/5 rounded"></div>
            </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="w-24 h-5 bg-white/10 rounded"></div>
            <div className="w-16 h-3 bg-white/5 rounded"></div>
        </div>
    </div>
);

const VerseSkeleton = () => (
    <div className="p-8 rounded-[32px] border border-white/5 bg-surface-card/20 animate-pulse">
        {/* Actions Row */}
        <div className="flex justify-between items-center mb-8 opacity-50">
            <div className="w-16 h-6 bg-white/10 rounded-full"></div>
            <div className="flex gap-1">
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
            </div>
        </div>
        {/* Arabic */}
        <div className="w-full flex justify-end mb-10">
            <div className="w-3/4 h-12 bg-white/10 rounded-xl"></div>
        </div>
        {/* Translation */}
        <div className="space-y-4 max-w-2xl">
            <div className="w-full h-4 bg-white/10 rounded"></div>
            <div className="w-5/6 h-4 bg-white/10 rounded"></div>
            <div className="w-1/2 h-3 bg-white/5 rounded mt-4"></div>
        </div>
    </div>
);

export const QuranReader: React.FC<QuranReaderProps> = ({ onLogUpdate }) => {
  // Data State
  const [chapters, setChapters] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [sortedChapters, setSortedChapters] = useState<Surah[]>([]);
  
  // Loading States
  const [loadingChapters, setLoadingChapters] = useState(true);
  
  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAi, setShowAi] = useState(false); // Toggle for AI Companion
  
  // Selection State
  const [listMode, setListMode] = useState<ListMode>('SURAH');
  const [selectedChapter, setSelectedChapter] = useState<Surah | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<Juz | null>(null);
  
  // Verse Content State
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Studio / Detail View State
  const [studioVerse, setStudioVerse] = useState<Verse | null>(null);
  const [studioInsight, setStudioInsight] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Settings
  const [reciterId, setReciterId] = useState<number>(7); 
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  
  // Audio State
  const [audioMap, setAudioMap] = useState<Record<string, string>>({});
  const [playingVerseId, setPlayingVerseId] = useState<number | null>(null); 
  const [playingArabicVerseKey, setPlayingArabicVerseKey] = useState<string | null>(null); 
  const [isCachedMap, setIsCachedMap] = useState<Record<number, boolean>>({}); 
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const arabicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial Fetch
    setLoadingChapters(true);
    Promise.all([fetchChapters(), fetchJuzs()]).then(([c, j]) => {
        setChapters(c);
        setJuzs(j);
        setSortedChapters(c); // Default order
        setLoadingChapters(false);
    });

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    arabicAudioRef.current = new Audio();
  }, []);

  useEffect(() => {
    // Handle List Mode Sorting
    let result = [...chapters];
    if (listMode === 'REVELATION') {
        result.sort((a, b) => a.revelation_order - b.revelation_order);
    } 
    
    // Filter by search
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.name_simple.toLowerCase().includes(lowerTerm) || 
            String(c.id).includes(lowerTerm) ||
            c.translated_name.name.toLowerCase().includes(lowerTerm)
        );
    }
    
    setSortedChapters(result);
  }, [listMode, chapters, searchTerm]);

  useEffect(() => {
    if (selectedChapter) {
        fetchRecitationAudio(reciterId, selectedChapter.id).then(setAudioMap);
        setIsCachedMap({});
    }
  }, [selectedChapter, reciterId]);

  // --- Logic ---

  const saveProgress = (chapter: Surah, verseKey?: string) => {
      const data = {
          surahName: chapter.name_simple,
          surahId: chapter.id,
          verseKey: verseKey || `${chapter.id}:1`,
          timestamp: Date.now()
      };
      localStorage.setItem('pulse_last_read', JSON.stringify(data));
  };

  const handleChapterSelect = async (chapter: Surah) => {
    setSelectedChapter(chapter);
    setSelectedJuz(null);
    setCurrentPage(1);
    setLoading(true);
    setAudioMap({});
    setVerses([]);
    setShowAi(false); // Reset AI view when reading starts
    
    saveProgress(chapter); // Save basic progress on open

    // Reset Audio
    stopAllAudio();
    
    const v = await fetchVerses(chapter.id, 1); // Page 1
    setVerses(v);
    
    checkCache(v);
    setLoading(false);
  };

  const loadMoreVerses = async () => {
    if (!selectedChapter && !selectedJuz) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    let newVerses: Verse[] = [];

    try {
        if (selectedChapter) {
            newVerses = await fetchVerses(selectedChapter.id, nextPage);
        } else if (selectedJuz) {
            newVerses = await fetchVersesByJuz(selectedJuz.id, nextPage);
        }
        
        if (newVerses.length > 0) {
            setVerses(prev => [...prev, ...newVerses]);
            checkCache(newVerses);
            setCurrentPage(nextPage);
        }
    } catch (e) {
        console.error("Pagination error", e);
    } finally {
        setLoadingMore(false);
    }
  };

  const checkCache = async (v: Verse[]) => {
    const cacheStatus: Record<number, boolean> = {};
    for (const verse of v) {
        const cached = await getAudio(verse.id);
        if (cached) cacheStatus[verse.id] = true;
    }
    setIsCachedMap(prev => ({...prev, ...cacheStatus}));
  };

  const openVerseStudio = async (verse: Verse) => {
      setStudioVerse(verse);
      setInsightLoading(true);
      if(selectedChapter) saveProgress(selectedChapter, verse.verse_key);
      
      const malay = verse.translations.find(t => t.resource_id === 39)?.text.replace(/<[^>]*>?/gm, '') || "";
      const english = verse.translations.find(t => t.resource_id === 131)?.text.replace(/<[^>]*>?/gm, '') || "";
      
      const insight = await generateVerseInsight(verse.text_uthmani, english || malay, verse.verse_key);
      setStudioInsight(insight);
      setInsightLoading(false);
  };

  const closeStudio = () => {
      setStudioVerse(null);
      setStudioInsight(null);
  };

  const handleCopy = (verse: Verse) => {
      const eng = getTranslation(verse, 131);
      const text = `${verse.text_uthmani}\n\n${eng} (The Clear Quran)\n\n${verse.verse_key} - NurQuran`;
      navigator.clipboard.writeText(text);
  };

  const toggleFontSize = () => {
      setFontSize(prev => prev === 'normal' ? 'large' : 'normal');
  };

  // --- Audio Management ---

  const stopAllAudio = () => {
      if (arabicAudioRef.current) {
          arabicAudioRef.current.pause();
          setPlayingArabicVerseKey(null);
      }
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
          audioContextRef.current.suspend();
      }
      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch(e) {}
      }
      setPlayingVerseId(null);
  };

  const playArabicAudio = (verseKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(selectedChapter) saveProgress(selectedChapter, verseKey);

    const url = audioMap[verseKey];
    if (!url || !arabicAudioRef.current) return;

    if (playingVerseId !== null) {
        if (audioContextRef.current) audioContextRef.current.suspend();
        setPlayingVerseId(null);
    }

    if (playingArabicVerseKey === verseKey) {
        arabicAudioRef.current.pause();
        setPlayingArabicVerseKey(null);
        return;
    }

    arabicAudioRef.current.src = url;
    arabicAudioRef.current.play();
    setPlayingArabicVerseKey(verseKey);
    
    arabicAudioRef.current.onended = () => {
        setPlayingArabicVerseKey(null);
    };
  };

  const playTranslation = async (verse: Verse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(selectedChapter) saveProgress(selectedChapter, verse.verse_key);
    
    const malayTranslation = verse.translations.find(t => t.resource_id === 39);
    if (!malayTranslation) return;
    
    if (playingArabicVerseKey !== null && arabicAudioRef.current) {
        arabicAudioRef.current.pause();
        setPlayingArabicVerseKey(null);
    }
    
    if (playingVerseId === verse.id) {
        if (audioContextRef.current) audioContextRef.current.suspend();
        setPlayingVerseId(null);
        return;
    }

    try {
      if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
      }

      setPlayingVerseId(verse.id);
      let base64Audio = await getAudio(verse.id);
      let fromCache = false;
      const malayText = malayTranslation.text.replace(/<[^>]*>?/gm, '');

      if (!base64Audio) {
        base64Audio = await generateMalaySpeech(malayText, 'Charon');
        if (base64Audio) {
            await saveAudio({
                id: verse.id,
                verseKey: verse.verse_key,
                text: malayText,
                audio: base64Audio,
                timestamp: Date.now()
            });
            setIsCachedMap(prev => ({...prev, [verse.id]: true}));
        }
      } else {
        fromCache = true;
      }
      
      if (base64Audio && audioContextRef.current) {
         const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
         const source = audioContextRef.current.createBufferSource();
         audioSourceRef.current = source;
         source.buffer = audioBuffer;
         source.playbackRate.value = playbackSpeed;
         source.connect(audioContextRef.current.destination);
         source.start();
         source.onended = () => setPlayingVerseId(null);
      }
    } catch (e) {
      console.error("TTS Error", e);
      setPlayingVerseId(null);
    }
  };

  const getTranslation = (verse: Verse, id: number) => {
      return verse.translations.find(t => t.resource_id === id)?.text.replace(/<[^>]*>?/gm, '') || "";
  }

  // --- RENDER ---

  if (!selectedChapter && !selectedJuz) {
    // --- DASHBOARD / HOME VIEW (GRID STRUCTURE) ---
    return (
        <div className="h-full w-full flex flex-col bg-background-dark/0 overflow-hidden relative">
            {/* Top Bar / Search & Toggle */}
            <div className="sticky top-0 z-10 bg-surface-dark/95 backdrop-blur-md p-6 border-b border-white/5 flex flex-col items-center">
                 <div className="w-full max-w-2xl flex items-center gap-3 bg-surface-card border border-white/5 rounded-full p-1.5 shadow-lg focus-within:border-primary/50 transition-colors">
                      {/* Search Icon */}
                      <span className="material-symbols-outlined text-secondary pl-3">{showAi ? 'smart_toy' : 'search'}</span>
                      
                      {/* Dynamic Input/Label */}
                      <input 
                        type="text"
                        placeholder={showAi ? "Ask AI Companion..." : "Search Surah..."}
                        className={`bg-transparent border-none outline-none text-white flex-1 placeholder-slate-500 text-sm h-10 ${showAi ? 'pointer-events-none opacity-50' : ''}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={showAi}
                      />

                      {/* Toggle Button */}
                      <button 
                        onClick={() => setShowAi(!showAi)}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${showAi ? 'bg-primary text-background-dark shadow-neon-sm' : 'bg-surface-hover text-slate-300 hover:text-white'}`}
                      >
                          {showAi ? 'Show Quran' : 'Ask AI'}
                      </button>
                 </div>
            </div>

            <div className="flex-1 w-full overflow-hidden relative">
                
                {/* AI COMPANION VIEW */}
                <div className={`absolute inset-0 transition-opacity duration-500 p-0 ${showAi ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <UnifiedAssistant onLogUpdate={onLogUpdate} className="h-full" />
                </div>

                {/* GRID LIST VIEW */}
                <div className={`absolute inset-0 overflow-y-auto no-scrollbar p-6 transition-opacity duration-500 ${!showAi ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                    
                    {/* Empty/Offline State */}
                    {!loadingChapters && chapters.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 mt-10">
                            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 animate-pulse">wifi_off</span>
                            <h3 className="text-xl font-bold text-white mb-2">Offline Mode</h3>
                            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                                Unable to load Quran chapters. Please check your internet connection. 
                                <br/><br/>
                                If you have visited before, content might be cached but requires a refresh.
                            </p>
                            <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-primary text-background-dark rounded-full font-bold shadow-neon-sm hover:scale-105 transition-transform">
                                Retry Connection
                            </button>
                        </div>
                    )}

                    {/* Quick Start Card (Compact) */}
                    {!loadingChapters && chapters.length > 0 && (
                        <div className="flex items-center justify-between p-6 bg-surface-card rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer mb-6 group" onClick={() => handleChapterSelect(chapters[0] || sortedChapters[0])}>
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                     <span className="material-symbols-outlined">auto_stories</span>
                                 </div>
                                 <div>
                                     <p className="text-xs text-secondary font-bold uppercase">Last Read</p>
                                     <h3 className="font-bold text-white text-lg">Al-Fatihah</h3>
                                 </div>
                             </div>
                             <button className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-white group-hover:bg-primary group-hover:text-background-dark transition-colors">
                                 <span className="material-symbols-outlined">play_arrow</span>
                             </button>
                        </div>
                    )}

                    {/* Grid List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20">
                        {loadingChapters 
                            ? Array.from({length: 12}).map((_, i) => <ChapterSkeleton key={i} />)
                            : sortedChapters.map(surah => (
                                <div 
                                    key={surah.id}
                                    onClick={() => handleChapterSelect(surah)}
                                    className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-surface-card/40 hover:bg-surface-card hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Number Circle */}
                                        <div className="w-10 h-10 rounded-full bg-surface-hover/50 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                            <span className="text-xs font-bold text-secondary group-hover:text-primary">{surah.id}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{surah.name_simple}</h3>
                                            <p className="text-[10px] text-secondary uppercase tracking-wide">{surah.translated_name.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-arabic text-lg text-slate-300 group-hover:text-white transition-colors block">{surah.name_arabic}</span>
                                        <span className="text-[10px] text-slate-600">{surah.verses_count} Ayahs</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- READING VIEW ---
  return (
    <div className="flex h-full flex-col bg-background-dark text-white relative">
      
      {/* Reading Header */}
      <div className="h-16 border-b border-white/5 bg-surface-dark/95 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => { setSelectedChapter(null); setSelectedJuz(null); }}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-secondary hover:text-white transition-colors"
              >
                  <span className="material-symbols-outlined">arrow_back</span>
              </button>
              {selectedChapter && (
                  <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedChapter.name_simple}
                          <span className="w-1 h-1 rounded-full bg-secondary"></span>
                          <span className="font-arabic font-normal text-lg">{selectedChapter.name_arabic}</span>
                      </h2>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-3">
               <button onClick={toggleFontSize} className="p-2 text-slate-400 hover:text-white"><span className="material-symbols-outlined text-lg">text_fields</span></button>
               <div className="w-px h-4 bg-white/10"></div>
               <select 
                    value={reciterId} 
                    onChange={(e) => setReciterId(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer"
                >
                    {RECITERS.map(r => (
                        <option key={r.id} value={r.id} className="bg-background-dark">{r.name}</option>
                    ))}
                </select>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative bg-gradient-to-b from-background-dark to-surface-dark">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
            
            {/* Bismillah */}
            {selectedChapter && selectedChapter.id !== 9 && !loading && (
                <div className="flex justify-center mb-12 opacity-80 animate-in fade-in slide-in-from-top-4 duration-700">
                     <Bismillah className="h-12 w-auto text-white/90" />
                </div>
            )}

            {loading ? (
                 <div className="space-y-4">
                     {Array.from({length: 4}).map((_, i) => <VerseSkeleton key={i} />)}
                 </div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse) => (
                        <div 
                            key={verse.id} 
                            className={`group p-8 rounded-[32px] transition-all border border-transparent ${playingVerseId === verse.id ? 'bg-surface-card border-primary/30 shadow-card' : 'hover:bg-surface-card/40 hover:border-white/5'}`}
                        >
                            {/* Actions Row */}
                            <div className="flex justify-between items-center mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 bg-background-dark/30 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                                    <span className="text-xs font-mono text-slate-400">{verse.verse_key}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => playArabicAudio(verse.verse_key, e)} className={`p-2 rounded-full hover:bg-white/10 ${playingArabicVerseKey === verse.verse_key ? 'text-primary' : 'text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-xl">{playingArabicVerseKey === verse.verse_key ? 'pause' : 'play_arrow'}</span>
                                    </button>
                                    <button onClick={(e) => playTranslation(verse, e)} className={`p-2 rounded-full hover:bg-white/10 ${playingVerseId === verse.id ? 'text-primary' : 'text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-xl">headphones</span>
                                    </button>
                                    <button onClick={() => openVerseStudio(verse)} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
                                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                    </button>
                                </div>
                            </div>

                            {/* Arabic */}
                            <div className="w-full text-right mb-10">
                                <h3 className={`font-arabic leading-[2.6] text-white ${fontSize === 'large' ? 'text-5xl' : 'text-4xl'}`}>
                                    {verse.text_uthmani}
                                </h3>
                            </div>

                            {/* Translation */}
                            <div className="space-y-3 max-w-2xl">
                                <p className={`text-slate-200 leading-relaxed font-light ${fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                                    {getTranslation(verse, 131)}
                                </p>
                                <p className="text-xs text-secondary pt-3 border-t border-white/5 inline-block">
                                    {getTranslation(verse, 39)}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center pt-8 pb-20">
                         <button 
                            onClick={loadMoreVerses}
                            disabled={loadingMore}
                            className="bg-surface-card hover:bg-surface-hover text-white px-8 py-3 rounded-full text-sm font-bold transition-colors border border-white/10 shadow-lg flex items-center gap-2"
                        >
                             {loadingMore && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                             {loadingMore ? 'Loading...' : 'Load Next Page'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* NEW VERSE STUDIO OVERLAY */}
      {studioVerse && (
        <div className="fixed inset-0 z-[100] bg-pulse-bg text-white font-display overflow-hidden flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-pulse-border px-6 py-4 md:px-10 bg-pulse-bg/80 backdrop-blur-xl z-20 sticky top-0 transition-all duration-300">
                <div className="flex items-center gap-4 text-white group cursor-pointer" onClick={closeStudio}>
                    <div className="size-8 text-pulse-primary group-hover:drop-shadow-[0_0_8px_rgba(66,133,244,0.5)] transition-all duration-300">
                        <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                            <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Quran Pulse</h2>
                </div>
                <div className="hidden md:flex flex-1 justify-center px-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pulse-surface-darker/50 border border-pulse-border backdrop-blur-sm">
                        <span className="text-pulse-text-light hover:text-white transition-colors text-sm font-medium leading-normal">{selectedChapter?.name_simple}</span>
                        <span className="text-gray-600 text-sm font-medium leading-normal">/</span>
                        <span className="text-white text-sm font-medium leading-normal">{studioVerse.verse_key}</span>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-6">
                    <button onClick={closeStudio} className="text-pulse-text-light hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center px-4 md:px-8 py-8 space-y-12 max-w-6xl mx-auto w-full overflow-y-auto no-scrollbar">
                <section className="w-full flex flex-col items-center text-center space-y-8 animate-fade-in relative z-10">
                    {/* Tooltip Actions (Top Right) */}
                    <div className="absolute right-0 top-0 hidden xl:flex flex-col gap-3">
                        <button onClick={() => handleCopy(studioVerse)} className="p-2 rounded-lg text-pulse-text-light hover:bg-pulse-surface-darker hover:text-pulse-primary border border-transparent hover:border-pulse-border transition-all" title="Copy">
                            <span className="material-symbols-outlined">content_copy</span>
                        </button>
                    </div>

                    <div className="w-full py-8 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-pulse-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
                         <h1 className="text-white font-arabic text-4xl md:text-5xl lg:text-7xl font-bold leading-relaxed px-4 dir-rtl drop-shadow-2xl relative">
                             {studioVerse.text_uthmani}
                         </h1>
                    </div>
                    
                    <div className="space-y-6 max-w-3xl">
                        <h2 className="text-gray-100 text-2xl md:text-3xl font-semibold leading-tight tracking-[-0.015em]">
                            {getTranslation(studioVerse, 131)}
                        </h2>
                        <p className="text-pulse-text-light text-lg font-light leading-normal tracking-wide opacity-90 italic">
                             {getTranslation(studioVerse, 39)}
                        </p>
                    </div>

                    {/* Audio Player Card */}
                    <div className="w-full max-w-2xl mt-8 bg-pulse-surface border border-pulse-border rounded-2xl p-4 flex items-center gap-5 shadow-glow transition-shadow hover:shadow-[0_0_30px_rgba(66,133,244,0.1)]">
                        <button 
                            onClick={(e) => playArabicAudio(studioVerse.verse_key, e)}
                            className={`size-14 flex items-center justify-center rounded-full bg-pulse-primary hover:bg-pulse-primary-dark text-white shadow-lg shadow-pulse-primary/20 hover:scale-105 transition-all flex-shrink-0 group ${playingArabicVerseKey === studioVerse.verse_key ? 'animate-pulse' : ''}`}
                        >
                            <span className="material-symbols-outlined !text-[32px] pl-1 group-hover:scale-110 transition-transform">
                                {playingArabicVerseKey === studioVerse.verse_key ? 'pause' : 'play_arrow'}
                            </span>
                        </button>
                        <div className="flex flex-col flex-1 gap-2.5">
                            <div className="flex justify-between items-end text-xs font-medium text-pulse-text-light tracking-wide">
                                <span>{RECITERS.find(r => r.id === reciterId)?.name}</span>
                                <span className="opacity-80">Recitation</span>
                            </div>
                            {/* Static Visualizer */}
                            <div aria-hidden="true" className="h-8 w-full flex items-center gap-0.5 opacity-90">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className={`w-1 rounded-full ${i % 3 === 0 ? 'bg-pulse-primary' : 'bg-pulse-border'} ${playingArabicVerseKey === studioVerse.verse_key ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 20 + 8}px` }}></div>
                                ))}
                            </div>
                        </div>
                        <button onClick={(e) => playTranslation(studioVerse, e)} className="text-pulse-text-light hover:text-white p-2 transition-colors" title="Play Translation">
                            <span className="material-symbols-outlined">headphones</span>
                        </button>
                    </div>
                </section>

                {/* Neural Insights Section */}
                <section className="w-full animate-fade-in-up mt-16 pb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 rounded-lg bg-pulse-primary/10 text-pulse-primary border border-pulse-primary/20">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <h3 className="text-white text-xl font-bold tracking-tight">Neural Insights</h3>
                        <div className="h-px bg-pulse-border flex-1 ml-4 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                    </div>

                    {insightLoading ? (
                         <div className="flex flex-col items-center justify-center py-20">
                             <div className="w-12 h-12 border-2 border-pulse-primary border-t-transparent rounded-full animate-spin"></div>
                             <p className="mt-4 text-pulse-text-light text-sm animate-pulse">Analyzing Divine Wisdom...</p>
                         </div>
                    ) : studioInsight ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 1. Context */}
                            <article className="bg-pulse-surface border border-pulse-border rounded-xl p-6 flex flex-col gap-4 hover:border-pulse-primary/40 hover:bg-pulse-surface-darker/50 transition-all duration-300 group shadow-lg">
                                <div className="flex items-center gap-2 text-pulse-text-light group-hover:text-pulse-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                                    <h4 className="font-semibold text-xs uppercase tracking-widest">Context</h4>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {studioInsight.history}
                                </p>
                                <div className="mt-auto pt-4 flex gap-2 border-t border-white/5">
                                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Revelation: {selectedChapter?.revelation_place}</span>
                                </div>
                            </article>

                            {/* 2. Linguistic Analysis */}
                            <article className="bg-pulse-surface border border-pulse-border rounded-xl p-6 flex flex-col gap-4 hover:border-pulse-primary/40 hover:bg-pulse-surface-darker/50 transition-all duration-300 group shadow-lg">
                                <div className="flex items-center gap-2 text-pulse-text-light group-hover:text-pulse-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">translate</span>
                                    <h4 className="font-semibold text-xs uppercase tracking-widest">Linguistic Analysis</h4>
                                </div>
                                <ul className="space-y-4">
                                    {studioInsight.keyWords?.map((kw: any, i: number) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-pulse-primary font-arabic text-xl mt-[-6px]">{kw.word}</span>
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-medium">{kw.word}</span>
                                                <span className="text-gray-400 text-xs mt-0.5">{kw.meaning}</span>
                                            </div>
                                        </li>
                                    ))}
                                    {!studioInsight.keyWords && <li className="text-sm text-gray-500">No key words analyzed.</li>}
                                </ul>
                            </article>

                            {/* 3. Core Themes */}
                            <article className="bg-pulse-surface border border-pulse-border rounded-xl p-6 flex flex-col gap-4 hover:border-pulse-primary/40 hover:bg-pulse-surface-darker/50 transition-all duration-300 group shadow-lg">
                                <div className="flex items-center gap-2 text-pulse-text-light group-hover:text-pulse-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">category</span>
                                    <h4 className="font-semibold text-xs uppercase tracking-widest">Core Themes</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 content-start">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pulse-primary/10 text-pulse-primary border border-pulse-primary/20 hover:bg-pulse-primary/20 cursor-default transition-colors">
                                        {studioInsight.coreTheme}
                                    </span>
                                </div>
                                <div className="mt-auto pt-4 border-t border-white/5">
                                    <p className="text-gray-500 text-xs italic line-clamp-4">"{studioInsight.tafsir}"</p>
                                </div>
                            </article>
                        </div>
                    ) : (
                        <div className="text-center text-red-400">Analysis Unavailable</div>
                    )}
                </section>
                
                {/* Chat Input Section */}
                <section className="w-full sticky bottom-6 z-30 px-2">
                    <div className="bg-pulse-surface-darker/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-5 flex items-center gap-4 shadow-2xl max-w-3xl mx-auto ring-1 ring-black/20 hover:ring-pulse-primary/30 transition-all duration-300">
                        <div className="text-pulse-primary animate-pulse">
                            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                        </div>
                        <input className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 focus:outline-none text-sm md:text-base py-3" placeholder="Ask Pulse about this verse..." type="text"/>
                        <button className="bg-pulse-surface hover:bg-pulse-primary text-pulse-text-light hover:text-white p-2.5 rounded-xl border border-pulse-border hover:border-pulse-primary/50 transition-all duration-300 group">
                            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-[20px]">send</span>
                        </button>
                    </div>
                </section>
            </main>
        </div>
      )}

    </div>
  );
};