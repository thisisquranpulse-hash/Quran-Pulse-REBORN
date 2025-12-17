import React, { useEffect, useRef, useState } from 'react';
import { getAiClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { AudioLog } from '../types';

// Encode function provided in guide
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Decode helper
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

// Audio Decode for playing
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

const VOICES = [
    { id: 'Zephyr', label: 'Zephyr (Calm)' },
    { id: 'Puck', label: 'Puck (Energetic)' },
    { id: 'Charon', label: 'Charon (Deep)' },
    { id: 'Kore', label: 'Kore (Gentle)' },
    { id: 'Fenrir', label: 'Fenrir (Strong)' },
];

interface LiveTutorProps {
    onLogUpdate: (log: AudioLog) => void;
}

export const LiveTutor: React.FC<LiveTutorProps> = ({ onLogUpdate }) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState("Ready to connect");
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    
    // Refs for audio contexts and processing
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<any>(null); 
    const stopSignalRef = useRef(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const cleanup = () => {
        stopSignalRef.current = true;
        if (sessionRef.current) {
            sessionRef.current = null;
        }
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
        setIsActive(false);
        setStatus("Disconnected");
    };

    const startSession = async () => {
        try {
            stopSignalRef.current = false;
            setStatus("Initializing Audio...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            // Resume Contexts if suspended (Browser policy)
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const ai = getAiClient();
            setStatus("Connecting to Gemini Live...");

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus("Connected! Speak now.");
                        setIsActive(true);
                        
                        if (!inputAudioContextRef.current) return;

                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (stopSignalRef.current) return;
                            
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            
                            // Visualize
                            drawVisualizer(inputData);

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         // Transcription Handling
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

                        // Audio Playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                ctx,
                                24000,
                                1
                            );
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            const outputNode = ctx.createGain(); // volume control if needed
                            source.connect(outputNode);
                            outputNode.connect(ctx.destination);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        setStatus("Connection Closed");
                        setIsActive(false);
                    },
                    onerror: (err) => {
                        console.error(err);
                        setStatus("Error occurred");
                        setIsActive(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    },
                    systemInstruction: `You are Ustaz Nur, a warm, wise, and engaging Islamic teacher. You are fluent in Bahasa Melayu and English.`,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                }
            });
            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Setup failed", e);
            setStatus("Setup Failed: " + (e as Error).message);
        }
    };

    const drawVisualizer = (data: Float32Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#5ab9ff'; // Pulse Primary
        
        const barWidth = 4;
        const gap = 2;
        const step = Math.floor(data.length / (canvas.width / (barWidth + gap)));

        for(let i=0; i < canvas.width; i+= (barWidth + gap)) {
            const dataIndex = Math.floor(i / (barWidth+gap)) * step;
            const val = Math.abs(data[dataIndex]);
            const h = val * canvas.height * 2;
            ctx.fillRect(i, (canvas.height - h)/2, barWidth, h);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 relative overflow-hidden">
            
            <div className="z-10 flex flex-col items-center gap-8 text-center max-w-lg">
                <div className={`p-6 rounded-full border-4 shadow-[0_0_30px_rgba(90,185,255,0.2)] transition-all duration-500 ${isActive ? 'border-primary shadow-neon bg-primary/20' : 'border-white/10 bg-white/5'}`}>
                     <span className="material-symbols-outlined text-6xl text-white">mic</span>
                </div>
                
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-white">Live Tutor</h2>
                    <p className="text-slate-400 font-light">Real-time conversation about Fiqh, Tafsir, and Quran.</p>
                </div>

                <div className="h-20 w-64 bg-background-dark rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                    <canvas ref={canvasRef} width={256} height={80} className="w-full h-full" />
                </div>

                <p className={`font-mono text-xs tracking-widest uppercase ${isActive ? 'text-primary animate-pulse' : 'text-slate-500'}`}>
                    STATUS: {status}
                </p>

                <div className="flex flex-col gap-4 items-center">
                    {!isActive && (
                         <div className="flex flex-col items-center gap-2">
                             <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select Voice Persona</label>
                             <select
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                className="bg-surface-card text-white border border-white/20 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary text-sm"
                             >
                                 {VOICES.map(v => (
                                     <option key={v.id} value={v.id}>{v.label}</option>
                                 ))}
                             </select>
                         </div>
                    )}

                    {!isActive ? (
                        <button 
                            onClick={startSession}
                            className="bg-white text-background-dark font-bold py-3 px-8 rounded-full text-sm uppercase tracking-wider shadow-neon hover:bg-primary transition-all transform hover:scale-105"
                        >
                            Start Session
                        </button>
                    ) : (
                        <button 
                            onClick={cleanup}
                            className="bg-red-500/20 text-red-400 border border-red-500/50 font-bold py-3 px-8 rounded-full text-sm uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
