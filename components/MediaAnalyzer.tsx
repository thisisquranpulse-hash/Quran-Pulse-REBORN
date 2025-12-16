import React, { useState, useEffect, useRef } from 'react';
import { analyzeMedia, transcribeAudio, decodeAudioData, searchHadith } from '../services/geminiService';
import { getAllCachedMetadata, getAudio, deleteAudio, CachedMetadata } from '../services/audioCache';
import { AudioLog } from '../types';
import ReactMarkdown from 'react-markdown';

interface MediaAnalyzerProps {
  logs: AudioLog[];
  onLogUpdate: (log: AudioLog) => void;
}

export const MediaAnalyzer: React.FC<MediaAnalyzerProps> = ({ logs, onLogUpdate }) => {
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [hadithQuery, setHadithQuery] = useState('');
  
  // Cached Audio State
  const [cachedItems, setCachedItems] = useState<CachedMetadata[]>([]);
  const [playingCacheId, setPlayingCacheId] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadCacheList();
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }, []);

  const loadCacheList = async () => {
      const items = await getAllCachedMetadata();
      setCachedItems(items);
  };

  const handlePlayCached = async (id: number) => {
      if (playingCacheId === id) return;
      try {
          const base64 = await getAudio(id);
          if (base64 && audioContextRef.current) {
              setPlayingCacheId(id);
              const buffer = await decodeAudioData(base64, audioContextRef.current);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.start();
              source.onended = () => setPlayingCacheId(null);
          }
      } catch (e) {
          console.error("Play error", e);
          setPlayingCacheId(null);
      }
  };

  const handleDeleteCached = async (id: number) => {
      if (confirm("Delete this saved audio?")) {
          await deleteAudio(id);
          loadCacheList();
      }
  };

  const formatBytes = (bytes: number) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Analyze Image/Video
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setAnalysisResult("Analyzing...");
    
    try {
        const type = file.type.startsWith('image') ? 'image' : 'video';
        const result = await analyzeMedia(file, "Analyze this media thoroughly. If it contains text, extract it. If it is a video, describe the events.", type);
        setAnalysisResult(result);
    } catch (err) {
        setAnalysisResult("Error analyzing media.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  // Audio Recording
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' }); 
            setLoading(true);
            try {
                const text = await transcribeAudio(blob);
                onLogUpdate({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'transcription',
                    userText: text,
                    audioUrl: URL.createObjectURL(blob)
                });
            } catch (e) {
                console.error(e);
                alert("Transcription failed");
            } finally {
                setLoading(false);
            }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
    } catch (e) {
        alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  // Hadith Search
  const handleHadithSearch = async () => {
      if (!hadithQuery.trim()) return;
      setLoading(true);
      try {
          const { text, groundingChunks } = await searchHadith(hadithQuery);
          onLogUpdate({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'hadith_search',
              userText: `Topic: ${hadithQuery}`,
              aiText: text,
              metadata: { chunks: groundingChunks }
          });
          setHadithQuery('');
      } catch (e) {
          console.error(e);
          alert("Hadith Search failed");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 h-full overflow-y-auto no-scrollbar">
        {/* Left Column: Tools */}
        <div className="space-y-6">
            {/* Analyzer */}
            <div className="bg-surface-card/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image_search</span>
                    Analyze Media
                </h3>
                <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-background-dark hover:file:bg-white transition-all cursor-pointer"
                />
                {loading && !recording && analysisResult === 'Analyzing...' && <div className="mt-4 text-primary animate-pulse text-sm">Processing...</div>}
                {analysisResult && (
                    <div className="mt-4 p-4 bg-background-dark/50 border border-white/10 rounded-xl text-sm text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {analysisResult}
                    </div>
                )}
            </div>

            {/* Recorder */}
            <div className="bg-surface-card/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">mic</span>
                    Voice Recorder
                </h3>
                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={recording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-neon ${recording ? 'bg-red-500 animate-pulse' : 'bg-primary hover:bg-white'}`}
                    >
                        <span className="material-symbols-outlined text-2xl text-background-dark">{recording ? 'stop' : 'mic'}</span>
                    </button>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                        {recording ? 'Recording...' : 'Tap to Record'}
                    </p>
                </div>
            </div>

            {/* Hadith Search */}
            <div className="bg-surface-card/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">library_books</span>
                    Hadith Verification
                </h3>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={hadithQuery}
                        onChange={(e) => setHadithQuery(e.target.value)}
                        placeholder="e.g. intentions, patience..."
                        className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleHadithSearch()}
                    />
                    <button 
                        onClick={handleHadithSearch}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl transition-colors"
                        disabled={loading && !recording}
                    >
                        <span className="material-symbols-outlined">search</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Searches for authentic narrations with source citations.</p>
            </div>
        </div>

        {/* Right Column: Data & Logs */}
        <div className="space-y-6">
            
            {/* Session Logs */}
            <div className="bg-surface-card/50 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[400px] shadow-lg">
                <div className="p-4 border-b border-white/10 bg-background-dark/30">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Session History</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {logs.length === 0 && <p className="text-center text-slate-500 text-xs mt-10">No logs yet.</p>}
                    {[...logs].reverse().map(log => (
                        <div key={log.id} className="border border-white/5 rounded-xl p-3 text-sm bg-background-dark/50">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold ${log.type === 'hadith_search' ? 'text-emerald-400' : 'text-primary'}`}>{log.type.replace('_', ' ')}</span>
                            </div>
                            {log.userText && (
                                <div className="mb-2 text-slate-300">
                                    <span className="font-bold text-slate-500 mr-2">Input:</span> {log.userText}
                                </div>
                            )}
                            {log.aiText && (
                                <div className="mb-2 text-white">
                                    <span className={`font-bold mr-2 ${log.type === 'hadith_search' ? 'text-emerald-400' : 'text-primary'}`}>Result:</span>
                                    <div className="prose prose-sm prose-invert mt-1">
                                        <ReactMarkdown>{log.aiText}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            {log.audioUrl && (
                                <audio src={log.audioUrl} controls className="w-full mt-2 h-8" />
                            )}
                            {log.metadata?.chunks && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-slate-500 uppercase mb-1">Sources:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {log.metadata.chunks.map((chunk: any, i: number) => (
                                            chunk.web ? (
                                                <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline truncate max-w-[150px]">
                                                    {chunk.web.title}
                                                </a>
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Saved Audio Library */}
            <div className="bg-surface-card/50 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[300px] shadow-lg">
                <div className="p-4 border-b border-white/10 bg-background-dark/30 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Audio Library</h3>
                    <button onClick={loadCacheList} className="text-[10px] text-primary hover:text-white uppercase tracking-wider">Refresh</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    {cachedItems.length === 0 && (
                        <div className="text-center text-slate-500 p-4 text-xs">
                            <p>No audio saved.</p>
                        </div>
                    )}
                    {cachedItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-background-dark/50 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                        {item.verseKey}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {formatBytes(item.size)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1">{item.text}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handlePlayCached(item.id)}
                                    className={`p-2 rounded-full transition-colors ${playingCacheId === item.id ? 'bg-primary text-background-dark' : 'bg-white/10 text-slate-300 hover:bg-white hover:text-background-dark'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">{playingCacheId === item.id ? 'graphic_eq' : 'play_arrow'}</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteCached(item.id)}
                                    className="p-2 rounded-full bg-white/5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
};