export interface Surah {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  revelation_order: number;
  translated_name: {
    name: string;
  };
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>; // e.g. "1": "1-7", "2": "1-141"
}

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations:Array<{
    text: string;
    resource_id: number;
    resource_name?: string;
  }>;
}

export interface AudioLog {
  id: string;
  timestamp: number;
  type: 'transcription' | 'conversation' | 'tts' | 'iqra_feedback' | 'hadith_search';
  userText?: string;
  aiText?: string;
  audioUrl?: string; // If we saved the blob
  metadata?: any;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  QURAN = 'QURAN',
  IQRA = 'IQRA', // New Flagship
  TANYA_USTAZ = 'TANYA_USTAZ',
  IBADAH = 'IBADAH', // Prayer & Qibla
  LIVE_TUTOR = 'LIVE_TUTOR',
  STUDIO = 'STUDIO',
  LIBRARY = 'LIBRARY'
}

export enum AssistantMode {
  FAST = 'FAST', // Gemini 2.5 Flash Lite
  DEEP = 'DEEP', // Gemini 3 Pro (Thinking)
  SEARCH = 'SEARCH', // Grounding
  MAPS = 'MAPS' // Maps
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  hijri: string;
}

export interface IqraLevel {
  level: number;
  title: string;
  description: string;
  total_pages: number;
  color: string;
}

export interface IqraProgress {
  level: number;
  completed_pages: number;
  accuracy: number; // 0-100
  last_updated: number;
  locked?: boolean;
}