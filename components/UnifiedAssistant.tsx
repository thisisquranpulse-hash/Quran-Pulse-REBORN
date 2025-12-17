import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse, getAiClient } from '../services/geminiService';
import { AssistantMode, AudioLog } from '../types';
import ReactMarkdown from 'react-markdown';
import { LiveServerMessage, Modality } from '@google/genai';

// --- HELPER FUNCTIONS FOR LIVE AUDIO ---
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const LIVE_VOICES = [
    { id: 'Zephyr', label: 'Zephyr (Calm)' },
    { id: 'Puck', label: 'Puck (Energetic)' },
    { id: 'Charon', label: 'Charon (Deep)' },
    { id: 'Kore', label: 'Kore (Gentle)' },
    { id: 'Fenrir', label: 'Fenrir (Strong)' },
];

interface UnifiedAssistantProps {
  onLogUpdate: (log: AudioLog) => void;
  className?: string; // Added for embedding
}

export const UnifiedAssistant: React.FC<UnifiedAssistantProps> = ({ onLogUpdate, className = "" }) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'LIVE'>('CHAT');

  // --- CHAT STATE ---
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string, chunks?: any[]}>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>(AssistantMode.DEEP);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  // --- LIVE STATE ---
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Ready");
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  
  // Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); 
  const stopSignalRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        (err) => console.log("Loc error", err)
    );
    return () => cleanupLive(); // Cleanup on unmount
  }, []);

  // --- CHAT LOGIC ---
  const handleChatSend = async () => {
    if (!input.trim() || chatLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    setChatLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role,
            parts: [{text: m.content}]
        }));

        const result = await getChatResponse(userMsg, assistantMode, history, location);
        const text = result.text || "";
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

        setMessages(prev => [...prev, {
            role: 'model', 
            content: text,
            chunks: groundingChunks
        }]);
    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, {role: 'model', content: "Maaf, sistem sedang sibuk. Sila cuba sebentar lagi."}]);
    } finally {
        setChatLoading(false);
    }
  };

  const renderSources = (chunks: any[]) => {
    if (!chunks || chunks.length === 0) return null;
    const links = chunks.map((chunk, i) => {
        if (chunk.web) return <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-primary underline text-[10px] mr-2 hover:text-white">{chunk.web.title}</a>;
        if (chunk.maps) return <a key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-blue-400 underline text-[10px] mr-2 hover:text-white">{chunk.maps.title}</a>;
        return null;
    });
    return (
        <div className="mt-2 p-2 bg-black/20 rounded border border-white/5">
            <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Sources:</p>
            <div className="flex flex-wrap">{links}</div>
        </div>
    );
  };

  // --- LIVE LOGIC ---
  const cleanupLive = () => {
    stopSignalRef.current = true;
    if (sessionRef.current) sessionRef.current = null;
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsLiveActive(false);
    setLiveStatus("Disconnected");
  };

  const startLiveSession = async () => {
    try {
        stopSignalRef.current = false;
        setLiveStatus("Initializing...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        if (inputAudioContextRef.current.state === 'suspended') await inputAudioContextRef.current.resume();
        if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

        const ai = getAiClient();
        setLiveStatus("Connecting...");

        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setLiveStatus("Listening");
                    setIsLiveActive(true);
                    
                    if (!inputAudioContextRef.current) return;

                    const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        if (stopSignalRef.current) return;
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        drawVisualizer(inputData);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscription += message.serverContent.outputTranscription.text;
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscription += message.serverContent.inputTranscription.text;
                    }

                    if (message.serverContent?.turnComplete) {
                        const turnLog: AudioLog = {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            type: 'conversation',
                            userText: currentInputTranscription,
                            aiText: currentOutputTranscription
                        };
                        onLogUpdate(turnLog);
                        currentInputTranscription = '';
                        currentOutputTranscription = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const ctx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        const outputNode = ctx.createGain(); 
                        source.connect(outputNode);
                        outputNode.connect(ctx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onclose: () => {
                    setLiveStatus("Ended");
                    setIsLiveActive(false);
                },
                onerror: (err) => {
                    console.error(err);
                    setLiveStatus("Error");
                    setIsLiveActive(false);
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                systemInstruction: `You are Ustaz Nur, a warm, wise, and engaging Islamic teacher.`,
                inputAudioTranscription: {},
                outputAudioTranscription: {}
            }
        });
        sessionRef.current = sessionPromise;
    } catch (e) {
        console.error("Setup failed", e);
        setLiveStatus("Failed");
    }
  };

  const drawVisualizer = (data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#38BDF8';
    const barWidth = 3;
    const gap = 2;
    const step = Math.floor(data.length / (canvas.width / (barWidth + gap)));
    for(let i=0; i < canvas.width; i+= (barWidth + gap)) {
        const dataIndex = Math.floor(i / (barWidth+gap)) * step;
        const val = Math.abs(data[dataIndex]);
        const h = val * canvas.height * 2.5;
        ctx.fillRect(i, (canvas.height - h)/2, barWidth, h);
    }
  };

  return (
    <div className={`flex flex-col h-full relative overflow-hidden transition-all duration-300 ${className}`}>
      
      {/* --- UNIFIED HEADER --- */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/10 bg-surface-dark/60 backdrop-blur-md z-10">
         <div className="flex items-center gap-2 mb-3 md:mb-0">
             <span className="material-symbols-outlined text-primary text-xl">school</span>
             <h2 className="font-bold text-white text-lg tracking-wide">AI Companion</h2>
         </div>
         
         {/* Tab Switcher */}
         <div className="flex bg-background-dark/50 p-1 rounded-full border border-white/5 relative">
             <button 
                onClick={() => { setActiveTab('CHAT'); if(isLiveActive) cleanupLive(); }}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all relative z-10 ${activeTab === 'CHAT' ? 'text-background-dark' : 'text-slate-400 hover:text-white'}`}
             >
                 Text Chat
             </button>
             <button 
                onClick={() => setActiveTab('LIVE')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all relative z-10 flex items-center gap-2 ${activeTab === 'LIVE' ? 'text-background-dark' : 'text-slate-400 hover:text-white'}`}
             >
                 <span>Live Voice</span>
                 {isLiveActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
             </button>
             
             {/* Slider Background */}
             <div className={`absolute top-1 bottom-1 w-[50%] bg-primary rounded-full transition-all duration-300 ${activeTab === 'CHAT' ? 'left-1' : 'left-[48%]'}`}></div>
         </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-hidden relative bg-background-dark/20">
          
          {/* 1. CHAT VIEW */}
          {activeTab === 'CHAT' && (
              <div className="h-full flex flex-col animate-in fade-in duration-300">
                  {/* Chat History */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                      {messages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60 text-center space-y-4">
                               <div className="w-20 h-20 bg-surface-card rounded-full flex items-center justify-center mb-2">
                                   <span className="material-symbols-outlined text-4xl text-primary">chat</span>
                               </div>
                               <div>
                                   <p className="font-bold text-white">Ask Ustaz AI</p>
                                   <p className="text-xs">Search, Maps & Deep Knowledge</p>
                               </div>
                               <div className="flex gap-2 justify-center flex-wrap max-w-sm">
                                   <button onClick={() => setInput("What are the pillars of Islam?")} className="text-[10px] border border-white/10 px-3 py-1 rounded-full hover:bg-white/10">Pillars of Islam</button>
                                   <button onClick={() => setInput("Find nearest mosque")} className="text-[10px] border border-white/10 px-3 py-1 rounded-full hover:bg-white/10">Nearest Mosque</button>
                               </div>
                          </div>
                      )}
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${m.role === 'user' ? 'bg-primary text-background-dark font-medium' : 'bg-surface-card border border-white/10 text-slate-200'}`}>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                                {m.chunks && renderSources(m.chunks)}
                            </div>
                        </div>
                      ))}
                      {chatLoading && (
                          <div className="flex justify-start">
                              <div className="bg-surface-card rounded-2xl p-3 border border-white/10">
                                  <div className="flex gap-1">
                                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-75"></div>
                                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-150"></div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-surface-dark/90 backdrop-blur-md border-t border-white/10">
                       <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                           {/* Quick Mode Toggles */}
                           <button 
                                onClick={() => setAssistantMode(AssistantMode.SEARCH)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${assistantMode === AssistantMode.SEARCH ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-transparent border-white/10 text-slate-400 hover:text-white'}`}
                           >
                               <span className="material-symbols-outlined text-xs">public</span> Search Web
                           </button>
                           <button 
                                onClick={() => setAssistantMode(AssistantMode.MAPS)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${assistantMode === AssistantMode.MAPS ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-transparent border-white/10 text-slate-400 hover:text-white'}`}
                           >
                               <span className="material-symbols-outlined text-xs">map</span> Maps
                           </button>
                           <button 
                                onClick={() => setAssistantMode(AssistantMode.DEEP)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${assistantMode === AssistantMode.DEEP ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-transparent border-white/10 text-slate-400 hover:text-white'}`}
                           >
                               <span className="material-symbols-outlined text-xs">psychology</span> Deep Think
                           </button>
                       </div>
                       <div className="flex gap-2">
                           <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                placeholder="Type your question..."
                                className="flex-1 bg-background-dark/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                           />
                           <button 
                                onClick={handleChatSend}
                                disabled={chatLoading}
                                className="bg-white text-background-dark rounded-xl px-4 hover:bg-primary transition-colors disabled:opacity-50"
                           >
                               <span className="material-symbols-outlined">send</span>
                           </button>
                       </div>
                  </div>
              </div>
          )}

          {/* 2. LIVE VIEW */}
          {activeTab === 'LIVE' && (
              <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 relative">
                  {/* Status Pill */}
                  <div className="absolute top-6">
                      <div className={`px-4 py-1 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLiveActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                          <div className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-primary animate-pulse' : 'bg-slate-500'}`}></div>
                          {liveStatus}
                      </div>
                  </div>

                  {/* Main Visualizer */}
                  <div className="relative mb-10 mt-10">
                      <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isLiveActive ? 'border-primary shadow-[0_0_50px_rgba(56,189,248,0.4)] scale-110' : 'border-white/10 bg-white/5'}`}>
                           <span className={`material-symbols-outlined text-6xl transition-colors duration-500 ${isLiveActive ? 'text-white' : 'text-slate-600'}`}>
                               {isLiveActive ? 'graphic_eq' : 'mic_off'}
                           </span>
                      </div>
                      
                      {/* Canvas Overlay for waveform */}
                      {isLiveActive && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 pointer-events-none opacity-80">
                               <canvas ref={canvasRef} width={256} height={96} className="w-full h-full" />
                          </div>
                      )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-center gap-6 w-full max-w-xs z-10">
                      {!isLiveActive && (
                          <div className="w-full">
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block text-center">Choose Persona</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {LIVE_VOICES.slice(0, 4).map(v => (
                                      <button 
                                        key={v.id} 
                                        onClick={() => setSelectedVoice(v.id)}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${selectedVoice === v.id ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 text-slate-400 border-transparent hover:border-white/20'}`}
                                      >
                                          {v.label.split(' ')[0]}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <button 
                          onClick={isLiveActive ? cleanupLive : startLiveSession}
                          className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all transform active:scale-95 ${isLiveActive ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white' : 'bg-white text-background-dark hover:bg-primary shadow-neon'}`}
                      >
                          {isLiveActive ? 'End Session' : 'Start Conversation'}
                      </button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};