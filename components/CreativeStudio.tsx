import React, { useState } from 'react';
import { generateImage, generateVideo, getAiClient } from '../services/geminiService';

export const CreativeStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image Configs
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Video Configs
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Veo Helper
  const checkVeoKey = async () => {
    if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
        if (activeTab === 'image') {
            const imgs = await generateImage(prompt, aspectRatio, imageSize);
            setGeneratedImages(imgs);
        } else {
            // Video
            await checkVeoKey();
            let operation = await generateVideo(prompt, aspectRatio === '9:16' ? '9:16' : '16:9');
            
            // Poll for completion
            const ai = getAiClient();
            while (!operation.done) {
                await new Promise(r => setTimeout(r, 5000));
                operation = await ai.operations.getVideosOperation({operation});
            }
            
            const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (uri && process.env.API_KEY) {
                // Fetch with key to get blob, or just construct URL if allowed. 
                // Documentation says: fetch(link + key)
                const vidRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
                const vidBlob = await vidRes.blob();
                setVideoUrl(URL.createObjectURL(vidBlob));
            }
        }
    } catch (e) {
        console.error("Generation failed", e);
        alert("Generation failed. See console for details.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto no-scrollbar">
        <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">Creative Studio</h2>
        
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab('image')}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${activeTab === 'image' ? 'bg-primary text-background-dark shadow-neon' : 'bg-surface-card text-slate-400 border border-white/10'}`}
            >
                Generate Image
            </button>
            <button 
                onClick={() => setActiveTab('video')}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${activeTab === 'video' ? 'bg-primary text-background-dark shadow-neon' : 'bg-surface-card text-slate-400 border border-white/10'}`}
            >
                Generate Video (Veo)
            </button>
        </div>

        <div className="bg-surface-card/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 max-w-2xl shadow-xl">
            <textarea 
                className="w-full p-4 bg-background-dark/80 border border-white/10 rounded-xl mb-4 h-32 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder={`Describe the ${activeTab} you want to create... e.g., "A peaceful mosque garden at sunset with golden light"`}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aspect Ratio</label>
                    <select 
                        value={aspectRatio} 
                        onChange={e => setAspectRatio(e.target.value)}
                        className="w-full p-2 bg-background-dark border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                    >
                        {activeTab === 'image' ? (
                            <>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="3:4">3:4</option>
                                <option value="4:3">4:3</option>
                                <option value="9:16">9:16</option>
                                <option value="16:9">16:9</option>
                            </>
                        ) : (
                            <>
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                            </>
                        )}
                    </select>
                </div>
                {activeTab === 'image' && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Size</label>
                        <select 
                            value={imageSize} 
                            onChange={e => setImageSize(e.target.value)}
                            className="w-full p-2 bg-background-dark border border-white/10 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                        >
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                        </select>
                    </div>
                )}
            </div>
            
            {activeTab === 'video' && (
                <div className="text-xs text-blue-300 mb-4 bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>Note: Veo requires a paid GCP project API key (popup will appear).</span>
                </div>
            )}

            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full bg-white text-background-dark py-3 rounded-xl font-bold hover:bg-primary transition-colors disabled:opacity-50 shadow-neon-sm"
            >
                {loading ? 'Generating...' : 'Generate'}
            </button>
        </div>

        <div className="mt-8">
            <h3 className="font-bold text-lg mb-4 text-white">Results</h3>
            <div className="flex flex-wrap gap-4">
                {activeTab === 'image' && generatedImages.map((src, i) => (
                    <img key={i} src={src} alt="Generated" className="w-full max-w-md rounded-2xl shadow-lg border border-white/10" />
                ))}
                {activeTab === 'video' && videoUrl && (
                    <video src={videoUrl} controls className="w-full max-w-md rounded-2xl shadow-lg border border-white/10" />
                )}
            </div>
        </div>
    </div>
  );
};