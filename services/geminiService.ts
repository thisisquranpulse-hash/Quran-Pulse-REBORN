
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AssistantMode } from "../types";

// Helper to get AI instance safely
export const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to sanitize JSON string from model output
const sanitizeJson = (text: string) => {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    return cleaned;
};

// Helper to convert File/Blob to base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const blobToBase64 = fileToBase64;

// Audio Decoding Helper for Raw PCM
export async function decodeAudioData(
  base64: string,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
    const data = decode(base64);
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

// Base64 decoding helper
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- DAILY REFLECTION ---
export const generateDailyReflection = async () => {
  const ai = getAiClient();
  const hour = new Date().getHours();
  let timeOfDay = "siang";
  if (hour < 5) timeOfDay = "tahajjud";
  else if (hour < 7) timeOfDay = "fajr";
  else if (hour < 12) timeOfDay = "pagi";
  else if (hour < 15) timeOfDay = "zuhur";
  else if (hour < 19) timeOfDay = "petang";
  else timeOfDay = "malam";

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Hasilkan satu mutiara kata atau refleksi Islamik yang sangat pendek (max 15 patah perkataan) yang sesuai untuk waktu ${timeOfDay}.
        Tulis dalam Bahasa Melayu yang indah dan puitis. 
        Hanya berikan teks sahaja tanpa tanda petikan.`,
      });
      return response.text?.trim() || "Zikir penenang hati, penghubung hamba dengan Ilahi.";
  } catch (e) {
      console.error("Reflection Error", e);
      return "Cukuplah Allah bagiku, tiada Tuhan melainkan Dia.";
  }
};

// --- DAILY HADITH ---
export const generateDailyHadith = async () => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Berikan satu Hadith Sahih yang pendek (Bukhari/Muslim) bersama sumbernya dan huraian ringkas (pengajaran) dalam Bahasa Melayu. Format jawapan dalam JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hadithText: { type: Type.STRING, description: "Teks hadith dalam Bahasa Melayu." },
                        source: { type: Type.STRING, description: "Sumber hadith (e.g., HR Bukhari)." },
                        explanation: { type: Type.STRING, description: "Huraian ringkas hadith." }
                    },
                    required: ["hadithText", "source", "explanation"]
                }
            }
        });
        return JSON.parse(sanitizeJson(response.text || "{}"));
    } catch (e) {
        console.error("Hadith Gen Error", e);
        return {
            hadithText: "Sesungguhnya setiap amalan itu bergantung kepada niat.",
            source: "HR Bukhari & Muslim",
            explanation: "Niat yang ikhlas adalah kunci penerimaan setiap ibadah."
        };
    }
};

// --- CHAT RESPONSE ---
export const getChatResponse = async (userMsg: string, mode: AssistantMode, history: any[], location?: {lat: number, lng: number}) => {
    const ai = getAiClient();
    let model = 'gemini-3-flash-preview';
    const config: any = {
        systemInstruction: "You are Ustaz Nur, a wise and friendly Islamic assistant. You provide answers based on authentic Quranic and Hadith sources. Be respectful and concise. Provide references from JAKIM or reputable scholars when asked about Fiqh."
    };

    if (mode === AssistantMode.DEEP) {
        model = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 32768 };
    } else if (mode === AssistantMode.FAST) {
        model = 'gemini-3-flash-preview';
    } else if (mode === AssistantMode.SEARCH) {
        model = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }];
    } else if (mode === AssistantMode.MAPS) {
        // Maps grounding is only supported in Gemini 2.5 series models.
        model = 'gemini-2.5-flash';
        config.tools = [{ googleMaps: {} }];
        if (location) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: { latitude: location.lat, longitude: location.lng }
                }
            };
        }
    }

    const response = await ai.models.generateContent({
        model,
        contents: [...history, { role: 'user', parts: [{ text: userMsg }] }],
        config
    });

    return response;
};

// --- IMAGE GENERATION ---
export const generateImage = async (prompt: string, aspectRatio: string, imageSize: string) => {
    const ai = getAiClient();
    const model = (imageSize === '2K' || imageSize === '4K') ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    // imageSize is only supported for gemini-3-pro-image-preview
    // For gemini-2.5-flash-image, do NOT send imageSize at all.
    const imageConfig: any = {
        aspectRatio: aspectRatio as any,
    };

    if (model === 'gemini-3-pro-image-preview') {
        imageConfig.imageSize = imageSize as any;
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig
        }
    });
    
    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                images.push(`data:image/png;base64,${part.inlineData.data}`);
            }
        }
    }
    return images;
};

// --- VIDEO GENERATION ---
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    const ai = getAiClient();
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio
        }
    });
    return operation;
};

// --- MALAY SPEECH (TTS) ---
export const generateMalaySpeech = async (text: string, voice: string = 'Kore') => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// --- VERSE INSIGHTS ---
export const generateVerseInsight = async (arabic: string, translation: string, key: string) => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide deep Islamic insight for verse ${key}. Arabic: ${arabic}. Translation: ${translation}. Include history, linguistic analysis of key words, core theme, and brief tafsir.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    history: { type: Type.STRING },
                    keyWords: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                meaning: { type: Type.STRING }
                            },
                            required: ["word", "meaning"]
                        }
                    },
                    coreTheme: { type: Type.STRING },
                    tafsir: { type: Type.STRING }
                },
                required: ["history", "keyWords", "coreTheme", "tafsir"]
            }
        }
    });
    return JSON.parse(sanitizeJson(response.text || "{}"));
};

// --- MEDIA ANALYSIS ---
export const analyzeMedia = async (file: File, prompt: string, type: 'image' | 'video') => {
    const ai = getAiClient();
    const base64 = await fileToBase64(file);
    const mimeType = file.type;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType } },
                { text: prompt }
            ]
        }
    });
    return response.text || "";
};

// --- TRANSCRIPTION ---
export const transcribeAudio = async (blob: Blob) => {
    const ai = getAiClient();
    const base64 = await blobToBase64(blob);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType: 'audio/webm' } },
                { text: "Transcribe this audio precisely. If it is a Quranic recitation, identify the verse if possible." }
            ]
        }
    });
    return response.text || "";
};

// --- HADITH SEARCH ---
export const searchHadith = async (query: string) => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for authentic Hadith regarding: ${query}. Provide the narration and source (e.g., Bukhari, Muslim).`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    return {
        text: response.text || "",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

// --- IQRA READING ANALYSIS ---
export const analyzeIqraReading = async (audioBlob: Blob, expectedText: string, level: number) => {
    const ai = getAiClient();
    const base64Audio = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
                { text: `Analyze this Quranic/Iqra reading (Level ${level}). Expected text: "${expectedText}". Evaluate makhraj and tajwid. Respond in JSON format.` }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    is_correct: { type: Type.BOOLEAN },
                    accuracy_score: { type: Type.NUMBER },
                    feedback_bm: { type: Type.STRING }
                },
                required: ["is_correct", "accuracy_score", "feedback_bm"]
            }
        }
    });
    
    try {
        return JSON.parse(sanitizeJson(response.text || "{}"));
    } catch (e) {
        return { is_correct: false, accuracy_score: 0, feedback_bm: "Gagal menganalisis bacaan." };
    }
};

// --- IQRA PAGE GENERATION ---
export const generateIqraPage = async (level: number) => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a practice page for Iqra Level ${level}. Focus on appropriate rules for this level. Respond in JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instruction: { type: Type.STRING },
                    rows: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING } 
                        } 
                    },
                    expectedText: { type: Type.STRING }
                },
                required: ["instruction", "rows", "expectedText"]
            }
        }
    });
    return JSON.parse(sanitizeJson(response.text || "{}"));
};

// --- IDENTIFY LOCATION & MOSQUES ---
export const identifyLocation = async (lat: number, lng: number) => {
    const ai = getAiClient();
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Identify the current location and find nearby mosques for prayer. Respond with 'LOCATION: [Name]' and a list.",
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: { latitude: lat, longitude: lng }
                }
            }
        }
    });
    return {
        text: response.text || "",
        chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};
