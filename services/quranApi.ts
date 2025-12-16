import { Surah, Verse, Juz } from '../types';

const BASE_URL = 'https://api.quran.com/api/v4';

// 39: Abdullah Muhammad Basmeih (Malay)
// 131: Dr. Mustafa Khattab, The Clear Quran (English)
const TRANSLATION_IDS = '39,131'; 

export const RECITERS = [
  { id: 7, name: 'Mishary Rashid Alafasy' },
  { id: 3, name: 'Abdur-Rahman as-Sudais' },
  { id: 4, name: 'Abu Bakr al-Shatri' },
  { id: 10, name: 'Saud al-Shuraim' }
];

export const fetchChapters = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters`);
    const data = await response.json();
    return data.chapters;
  } catch (error) {
    console.error("Failed to fetch chapters", error);
    return [];
  }
};

export const fetchJuzs = async (): Promise<Juz[]> => {
  try {
    const response = await fetch(`${BASE_URL}/juzs`);
    const data = await response.json();
    return data.juzs;
  } catch (error) {
    console.error("Failed to fetch juzs", error);
    // Fallback static 30 juz if API fails
    return Array.from({length: 30}, (_, i) => ({
        id: i+1, 
        juz_number: i+1, 
        verse_mapping: {}
    }));
  }
};

export const fetchVerses = async (chapterId: number, page: number = 1): Promise<Verse[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/verses/by_chapter/${chapterId}?translations=${TRANSLATION_IDS}&fields=text_uthmani&per_page=50&page=${page}`
    );
    const data = await response.json();
    return data.verses || [];
  } catch (error) {
    console.error("Failed to fetch verses", error);
    return [];
  }
};

// Fetch verses for a specific Juz
export const fetchVersesByJuz = async (juzId: number, page: number = 1): Promise<Verse[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/verses/by_juz/${juzId}?translations=${TRANSLATION_IDS}&fields=text_uthmani&per_page=50&page=${page}`
    );
    const data = await response.json();
    return data.verses || [];
  } catch (error) {
    console.error("Failed to fetch verses by juz", error);
    return [];
  }
};

export const fetchRecitationAudio = async (reciterId: number, chapterId: number): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`${BASE_URL}/recitations/${reciterId}/by_chapter/${chapterId}?per_page=300`);
    const data = await response.json();
    
    const audioMap: Record<string, string> = {};
    if (data.audio_files) {
      data.audio_files.forEach((file: any) => {
        let url = file.url;
        if (url.startsWith('//')) {
            url = 'https:' + url;
        } else if (!url.startsWith('http')) {
             url = 'https://verses.quran.com/' + url;
        }
        audioMap[file.verse_key] = url;
      });
    }
    return audioMap;
  } catch (error) {
    console.error("Failed to fetch recitation", error);
    return {};
  }
};