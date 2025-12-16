import React, { useEffect, useState, useRef } from 'react';
import { Surah, Verse, Juz, AudioLog } from '../types';
import { fetchChapters, fetchVerses, fetchJuzs, fetchVersesByJuz, fetchRecitationAudio, RECITERS } from '../services/quranApi';
import { generateMalaySpeech, decodeAudioData, generateVerseInsight } from '../services/geminiService';
import { getAudio, saveAudio } from '../services/audioCache';

interface QuranReaderProps {
  onLogUpdate?: (log: AudioLog) => void;
}

type ListMode = 'SURAH' | 'JUZ' | 'REVELATION';

export const QuranReader: React.FC<QuranReaderProps> = ({ onLogUpdate }) => {
  // Data State
  const [chapters, setChapters] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [sortedChapters, setSortedChapters] = useState<Surah[]>([]);
  
  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState('');
  
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
    Promise.all([fetchChapters(), fetchJuzs()]).then(([c, j]) => {
        setChapters(c);
        setJuzs(j);
        setSortedChapters(c); // Default order
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

  const handleChapterSelect = async (chapter: Surah) => {
    setSelectedChapter(chapter);
    setSelectedJuz(null);
    setCurrentPage(1);
    setLoading(true);
    setAudioMap({});
    setVerses([]);
    
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
        <div className="h-full w-full flex flex-col bg-background-dark overflow-y-auto no-scrollbar">
            {/* Top Bar / Search */}
            <div className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-md p-6 border-b border-white/5 flex flex-col items-center">
                 <div className="w-full max-w-4xl flex items-center gap-4 bg-surface-card/50 border border-white/10 rounded-full px-6 py-3 shadow-lg focus-within:border-primary/50 transition-colors">
                      <span className="material-symbols-outlined text-slate-400">search</span>
                      <input 
                        type="text"
                        placeholder="What do you want to read today?"
                        className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                 </div>
            </div>

            <div className="flex-1 w-full max-w-6xl mx-auto p-6 space-y-8">
                
                {/* Hero Section: "Start Reading" */}
                <div className="w-full bg-gradient-to-r from-surface-card to-[#06152B] rounded-3xl p-8 border border-white/5 relative overflow-hidden shadow-2xl flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => handleChapterSelect(chapters[0] || sortedChapters[0])}>
                     <div className="relative z-10 space-y-4">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             <span className="material-symbols-outlined text-sm">menu_book</span>
                             Start Reading
                         </div>
                         <div className="space-y-1">
                             <h1 className="text-3xl font-bold text-white">Al-Fatihah</h1>
                             <p className="text-slate-400">The Opener • 7 Verses</p>
                         </div>
                         <button className="mt-4 bg-white text-background-dark px-6 py-2 rounded-full font-bold text-sm shadow-neon-sm hover:bg-primary transition-colors">
                             Begin
                         </button>
                     </div>
                     {/* Decorative Arabic Calligraphy BG */}
                     <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
                         <span className="font-arabic text-9xl">ٱلْفَاتِحَة</span>
                     </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/5 pb-1">
                    <button onClick={() => setListMode('SURAH')} className={`pb-3 px-2 text-sm font-bold transition-all ${listMode === 'SURAH' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}>Surah</button>
                    <button onClick={() => setListMode('JUZ')} className={`pb-3 px-2 text-sm font-bold transition-all ${listMode === 'JUZ' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}>Juz</button>
                    <button onClick={() => setListMode('REVELATION')} className={`pb-3 px-2 text-sm font-bold transition-all ${listMode === 'REVELATION' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}>Revelation</button>
                </div>

                {/* Grid List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedChapters.map(surah => (
                        <div 
                            key={surah.id}
                            onClick={() => handleChapterSelect(surah)}
                            className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-surface-card/30 hover:bg-surface-card hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                {/* Number Diamond */}
                                <div className="w-10 h-10 bg-background-dark border border-white/10 rounded-md rotate-45 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                    <span className="-rotate-45 text-xs font-bold text-slate-300 group-hover:text-primary">{surah.id}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-primary transition-colors">{surah.name_simple}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">{surah.translated_name.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-arabic text-lg text-slate-300 group-hover:text-white transition-colors block">{surah.name_arabic}</span>
                                <span className="text-[10px] text-slate-600">{surah.verses_count} Verses</span>
                            </div>
                        </div>
                    ))}
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
                className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                  <span className="material-symbols-outlined">arrow_back</span>
              </button>
              {selectedChapter && (
                  <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedChapter.name_simple}
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
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

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
            
            {/* Bismillah */}
            {selectedChapter && selectedChapter.id !== 9 && (
                <div className="flex justify-center mb-12 opacity-80">
                     <img src="https://quran.com/images/bismillah.svg" alt="Bismillah" className="h-12 invert" />
                </div>
            )}

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 space-y-4">
                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-xs text-primary animate-pulse">Retrieving Verses...</p>
                 </div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse) => (
                        <div 
                            key={verse.id} 
                            className={`group p-6 rounded-2xl transition-all border border-transparent ${playingVerseId === verse.id ? 'bg-surface-card border-primary/30' : 'hover:bg-surface-card/30 hover:border-white/5'}`}
                        >
                            {/* Actions Row */}
                            <div className="flex justify-between items-center mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 bg-background-dark/50 px-3 py-1 rounded-full border border-white/5">
                                    <span className="text-xs font-mono text-slate-400">{verse.verse_key}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => playArabicAudio(verse.verse_key, e)} className={`p-1.5 rounded hover:bg-white/10 ${playingArabicVerseKey === verse.verse_key ? 'text-primary' : 'text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-lg">{playingArabicVerseKey === verse.verse_key ? 'pause' : 'play_arrow'}</span>
                                    </button>
                                    <button onClick={(e) => playTranslation(verse, e)} className={`p-1.5 rounded hover:bg-white/10 ${playingVerseId === verse.id ? 'text-primary' : 'text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-lg">headphones</span>
                                    </button>
                                    <button onClick={() => openVerseStudio(verse)} className="p-1.5 rounded hover:bg-white/10 text-slate-400">
                                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                                    </button>
                                </div>
                            </div>

                            {/* Arabic */}
                            <div className="w-full text-right mb-8">
                                <h3 className={`font-arabic leading-[2.4] text-white ${fontSize === 'large' ? 'text-5xl' : 'text-4xl'}`}>
                                    {verse.text_uthmani}
                                </h3>
                            </div>

                            {/* Translation */}
                            <div className="space-y-2 max-w-2xl">
                                <p className={`text-slate-200 leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                                    {getTranslation(verse, 131)}
                                </p>
                                <p className="text-xs text-slate-500 pt-2 border-t border-white/5 inline-block">
                                    {getTranslation(verse, 39)}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center pt-8 pb-20">
                         <button 
                            onClick={loadMoreVerses}
                            disabled={loadingMore}
                            className="bg-surface-card hover:bg-surface-hover text-white px-8 py-3 rounded-full text-sm font-bold transition-colors border border-white/10"
                        >
                             {loadingMore ? 'Loading...' : 'Load Next Page'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Studio Overlay (Unchanged from previous logic, just ensuring it renders) */}
      {studioVerse && (
        <div className="absolute inset-0 z-50 bg-[#040E1E]/90 backdrop-blur-md flex justify-center items-center p-4">
             {/* Studio Modal Code (Reused from previous iteration essentially) */}
             <div className="relative w-full md:w-[600px] bg-[#0B1A34] border border-[#1E3A5F] rounded-[32px] shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center p-6 border-b border-white/5">
                     <h3 className="text-white font-bold">Verse Studio</h3>
                     <button onClick={closeStudio} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="text-center font-arabic text-4xl leading-loose">{studioVerse.text_uthmani}</div>
                      <div className="bg-surface-card/50 p-4 rounded-xl border border-white/5">
                          {insightLoading ? <div className="text-center text-primary animate-pulse">Generating AI Insight...</div> : (
                              studioInsight ? (
                                  <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                          <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                          <span className="text-sm font-bold text-white">{studioInsight.coreTheme}</span>
                                      </div>
                                      <p className="text-sm text-slate-300">{studioInsight.tafsir}</p>
                                  </div>
                              ) : <p className="text-center text-red-400">Analysis Failed</p>
                          )}
                      </div>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};