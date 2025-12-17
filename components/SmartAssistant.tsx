import React, { useState, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { AssistantMode } from '../types';
import ReactMarkdown from 'react-markdown';

export const SmartAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string, chunks?: any[]}>>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>(AssistantMode.DEEP);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        (err) => console.log("Loc error", err)
    );
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    setLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role,
            parts: [{text: m.content}]
        }));

        const result = await getChatResponse(userMsg, mode, history, location);
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
        setLoading(false);
    }
  };

  const renderSources = (chunks: any[]) => {
    if (!chunks || chunks.length === 0) return null;
    
    const links = chunks.map((chunk, i) => {
        if (chunk.web) {
            return <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-primary underline text-xs mr-2">{chunk.web.title}</a>
        }
        if (chunk.maps) {
             return <a key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs mr-2">{chunk.maps.title}</a> 
        }
        return null;
    });

    return (
        <div className="mt-2 p-3 bg-background-dark/50 rounded-lg border border-white/10">
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Sumber Rujukan:</p>
            <div className="flex flex-wrap">{links}</div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg border border-white/10">
      <div className="bg-surface-dark/80 p-4 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
        <h2 className="font-bold text-white tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            Tanya Ustaz AI
        </h2>
        <div className="flex gap-2">
            <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value as AssistantMode)}
                className="text-xs p-2 border border-white/20 rounded bg-background-dark text-white focus:border-primary focus:outline-none"
            >
                <option value={AssistantMode.DEEP}>Deep Thinker (Pro)</option>
                <option value={AssistantMode.FAST}>Fast Response</option>
                <option value={AssistantMode.SEARCH}>Web Search</option>
                <option value={AssistantMode.MAPS}>Maps (Nearby)</option>
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-background-dark/20">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 text-center">
                <span className="material-symbols-outlined text-6xl mb-4">quiz</span>
                <p className="text-sm font-bold">Assalamu'alaikum</p>
                <p className="text-xs mt-2">Tanya soalan tentang Fiqh, Sejarah Islam, atau Hukum (JAKIM).</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Hukum melabur ASB?', 'Sejarah perang Badar', 'Cara solat jamak', 'Masjid terdekat'].map(q => (
                        <button key={q} onClick={() => setInput(q)} className="px-4 py-2 bg-surface-card rounded-full text-xs hover:bg-surface-hover border border-white/5 transition-colors">
                            "{q}"
                        </button>
                    ))}
                </div>
            </div>
        )}
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${m.role === 'user' ? 'bg-primary text-background-dark' : 'bg-surface-card border border-white/10 text-slate-100'}`}>
                    <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>
                            {m.content}
                        </ReactMarkdown>
                    </div>
                    {m.chunks && renderSources(m.chunks)}
                </div>
            </div>
        ))}
        {loading && <div className="text-center text-xs text-primary animate-pulse">Ustaz sedang menulis...</div>}
      </div>

      <div className="p-4 bg-surface-dark/80 border-t border-white/10 backdrop-blur-md">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tanya soalan..."
                className="flex-1 p-3 bg-background-dark/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-white text-background-dark px-6 rounded-xl hover:bg-primary transition-colors disabled:opacity-50 font-medium shadow-neon-sm"
            >
                Hantar
            </button>
        </div>
      </div>
    </div>
  );
};
