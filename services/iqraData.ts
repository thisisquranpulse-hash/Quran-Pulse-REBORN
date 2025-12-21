
export interface DigitalPage {
    level: number;
    page: number;
    rows: string[][]; // Grid layout: Rows of text (Right to Left)
    instruction: string;
    expectedText: string; // Phonetic or guidance for AI analysis
}

// Helper to flat map for phonetics
const flat = (rows: string[][]) => rows.flat().join(' ');

export const IQRA_CURRICULUM: Record<string, DigitalPage> = {
    // ================= IQRA 1 (HURUF TUNGGAL BERBARIS ATAS) =================
    // NEW: Added Page 1-1 to prevent navigation error
    "1-1": {
        level: 1, page: 1,
        instruction: "Kenali Huruf Hijaiyah Asas (Alif - Jim).",
        rows: [
            ["ا", "ب", "ت"],
            ["ث", "ج", "ا"],
            ["ب", "ت", "ث"],
            ["ج", "ث", "ت"],
            ["ب", "ا", "ج"]
        ],
        expectedText: "Alif Ba Ta, Tsa Jim Alif, Ba Ta Tsa, Jim Tsa Ta, Ba Alif Jim"
    },
    "1-2": {
        level: 1, page: 2,
        instruction: "Mengenal 28 Huruf Asal dan Bentuknya.",
        rows: [
            ["ا", "ب", "ت", "ث", "ج"],
            ["ح", "خ", "د", "ذ", "ر"],
            ["ز", "س", "ش", "ص", "ض"],
            ["ط", "ظ", "ع", "غ", "ف"],
            ["ق", "ك", "ل", "م", "ن"],
            ["و", "هـ", "لا", "ء", "ي"]
        ],
        expectedText: "Alif Ba Ta Tsa Jim, Ha Kho Dal Dzal Ro, Zai Sin Syin Sod Dhod, Tho Zho 'Ain Ghoin Fa, Qof Kaf Lam Mim Nun, Wau Ha LamAlif Hamzah Ya"
    },
    "1-3": {
        level: 1, page: 3,
        instruction: "Bunyi 'A' dan 'BA'. Teknik Kotak (Kanan & Kiri).",
        rows: [
            ["بَ", "اَ"], // TAJUK
            ["بَ", "اَ", "بَ", "اَ", "بَ", "اَ"], // Baris 1: Selang-seli asas
            ["بَ", "اَ", "اَ", "اَ", "اَ", "بَ"], // Baris 2: Ujian A 2 kali
            ["بَ", "بَ", "اَ", "اَ", "بَ", "بَ"], // Baris 3: Ujian BA 2 kali
            ["بَ", "اَ", "بَ", "اَ", "بَ", "اَ"], // Baris 4: Pengukuhan
            ["اَ", "اَ", "اَ", "بَ", "بَ", "بَ"], // Baris 5: Ketahanan
            ["اَ", "بَ", "اَ", "بَ"]              // Baris 6: Gabungan (Single block)
        ],
        expectedText: "Ba A, Ba A Ba A Ba A, Ba A A A A Ba, Ba Ba A A Ba Ba, Ba A Ba A Ba A, A A A Ba Ba Ba, A Ba A Ba"
    },
    "1-4": {
        level: 1, page: 4,
        instruction: "Huruf TA (تَ). Perbezaan Titik: Atas vs Bawah.",
        rows: [
            ["تَ", "بَ"], // Tajuk
            ["تَ", "بَ", "اَ", "تَ", "اَ", "بَ"], // Row 1: Ta Ba A (Kanan) - Ta A Ba (Kiri)
            ["بَ", "اَ", "تَ", "بَ", "تَ", "اَ"], // Row 2: Ba A Ta (Kanan) - Ba Ta A (Kiri)
            ["تَ", "اَ", "تَ", "بَ", "اَ", "تَ"], // Row 3: Ta A Ta (Kanan) - Ba A Ta (Kiri)
            ["تَ", "بَ", "تَ", "تَ", "اَ", "تَ"], // Row 4: Ta Ba Ta (Kanan) - Ta A Ta (Kiri)
            ["اَ", "بَ", "تَ", "اَ", "بَ", "تَ"]  // Row 5: A Ba Ta (Kanan) - A Ba Ta (Kiri)
        ],
        expectedText: "Ta Ba, Ta Ba A Ta A Ba, Ba A Ta Ba Ta A, Ta A Ta Ba A Ta, Ta Ba Ta Ta A Ta, A Ba Ta A Ba Ta"
    },
    "1-5": {
        level: 1, page: 5,
        instruction: "Huruf TSA (ثَ). 3 Titik, bunyi hujung lidah lembut.",
        rows: [
            ["ثَ", "تَ", "بَ"],
            ["ثَ", "اَ", "بَ", "ثَ", "بَ", "تَ"],
            ["بَ", "اَ", "ثَ", "تَ", "ثَ", "بَ"],
            ["اَ", "تَ", "بَ", "ثَ", "بَ", "ثَ"],
            ["تَ", "بَ", "ثَ", "تَ", "ثَ", "ثَ"],
            ["ثَ", "تَ", "ثَ", "بَ", "ثَ", "تَ"],
            ["اَ", "بَ", "تَ", "ثَ"]
        ],
        expectedText: "Tsa Ta Ba, Tsa A Ba Tsa Ba Ta, Ba A Tsa Ta Tsa Ba, A Ta Ba Tsa Ba Tsa, Ta Ba Tsa Ta Tsa Tsa, Tsa Ta Tsa Ba Tsa Ta, A Ba Ta Tsa"
    },
    "1-6": {
        level: 1, page: 6,
        instruction: "Huruf JA, HA, KHO (ج ح خ). Perut Buncit.",
        rows: [
            ["جَ", "حَ", "خَ"],
            ["جَ", "اَ", "خَ", "خَ", "اَ", "جَ"],
            ["جَ", "تَ", "خَ", "ثَ", "اَ", "خَ"],
            ["تَ", "حَ", "ثَ", "بَ", "اَ", "خَ"],
            ["بَ", "حَ", "ثَ", "جَ", "اَ", "خَ"],
            ["تَ", "حَ", "جَ", "تَ", "اَ", "خَ"],
            ["اَ", "خَ", "خَ", "جَ", "حَ", "خَ"],
            ["جَ", "حَ", "خَ", "ثَ", "تَ", "بَ", "اَ"]
        ],
        expectedText: "Ja Ha Kho, Ja A Kho Kho A Ja, Ja Ta Kho Tsa A Kho, Ta Ha Tsa Ba A Kho, Ba Ha Tsa Ja A Kho, Ta Ha Ja Ta A Kho, A Kho Kho Ja Ha Kho, Ja Ha Kho Tsa Ta Ba A"
    },
    "1-7": {
        level: 1, page: 7,
        instruction: "Huruf DA & DZA (د ذ). Bentuk Siku.",
        rows: [
            ["دَ", "ذَ"],
            ["خَ", "دَ", "ذَ", "دَ", "اَ", "ذَ"],
            ["ذَ", "حَ", "جَ", "اَ", "حَ", "دَ"],
            ["ثَ", "اَ", "ذَ", "خَ", "تَ", "دَ"],
            ["ذَ", "بَ", "حَ", "خَ", "حَ", "جَ"],
            ["اَ", "خَ", "دَ", "حَ", "دَ", "ثَ"],
            ["خَ", "دَ", "ذَ", "دَ", "اَ", "ذَ"],
            ["جَ", "حَ", "خَ", "دَ", "ذَ"]
        ],
        expectedText: "Da Dza, Kho Da Dza Da A Dza, Dza Ha Ja A Ha Da, Tsa A Dza Kho Ta Da, Dza Ba Ha Kho Ha Ja, A Kho Da Ha Da Tsa, Kho Da Dza Da A Dza, Ja Ha Kho Da Dza"
    },
    "1-8": {
        level: 1, page: 8,
        instruction: "Huruf RO & ZA (ر ز). Bentuk Melengkung (Pisang).",
        rows: [
            ["رَ", "زَ"],
            ["رَ", "اَ", "زَ", "ذَ", "رَ", "زَ"],
            ["ذَ", "خَ", "ذَ", "زَ", "دَ", "رَ"],
            ["ثَ", "رَ", "زَ", "ذَ", "حَ", "دَ"],
            ["تَ", "زَ", "دَ", "خَ", "رَ", "جَ"],
            ["ذَ", "حَ", "ثَ", "بَ", "زَ", "رَ"],
            ["جَ", "اَ", "زَ", "خَ", "اَ", "جَ"],
            ["دَ", "ذَ", "رَ", "زَ"]
        ],
        expectedText: "Ro Zai, Ro A Zai Dza Ro Zai, Dza Kho Dza Zai Da Ro, Tsa Ro Zai Dza Ha Da, Ta Zai Da Kho Ro Ja, Dza Ha Tsa Ba Zai Ro, Ja A Zai Kho A Ja, Da Dza Ro Zai"
    },
    "1-9": {
        level: 1, page: 9,
        instruction: "Huruf SA & SYA (س ش). Gigi 3.",
        rows: [
            ["سَ", "شَ"],
            ["سَ", "اَ", "شَ", "سَ", "شَ", "سَ", "شَ"],
            ["شَ", "ذَ", "ثَ", "شَ", "تَ", "دَ"],
            ["سَ", "دَ", "رَ", "دَ", "رَ", "سَ"],
            ["ذَ", "خَ", "زَ", "اَ", "سَ", "شَ"],
            ["زَ", "حَ", "ثَ", "شَ", "جَ", "زَ"],
            ["خَ", "سَ", "دَ", "شَ", "زَ", "جَ"],
            ["زَ", "سَ", "شَ"]
        ],
        expectedText: "Sa Sya, Sa A Sya Sa Sya Sa Sya, Sya Dza Tsa Sya Ta Da, Sa Da Ro Da Ro Sa, Dza Kho Zai A Sa Sya, Zai Ha Tsa Sya Ja Zai, Kho Sa Da Sya Zai Ja, Zai Sa Sya"
    },
    "1-10": {
        level: 1, page: 10,
        instruction: "Huruf SO & DHO (ص ض). Mangkuk Bujur (Istila').",
        rows: [
            ["صَ", "ضَ"],
            ["صَ", "اَ", "ضَ", "حَ", "ضَ", "رَ"],
            ["صَ", "اَ", "ضَ", "شَ", "خَ", "زَ"],
            ["شَ", "بَ", "رَ", "ضَ", "رَ", "بَ"],
            ["صَ", "حَ", "ثَ", "صَ", "دَ", "زَ"],
            ["ضَ", "شَ", "دَ", "صَ", "دَ", "ضَ"],
            ["سَ", "حَ", "ذَ", "رَ", "صَ", "دَ"],
            ["ثَ", "خَ", "زَ", "ضَ", "جَ", "ذَ"],
            ["صَ", "رَ", "ضَ"]
        ],
        expectedText: "Sho Dho, Sho A Dho Ha Dho Ro, Sho A Dho Sya Kho Zai, Sya Ba Ro Dho Ro Ba, Sho Ha Tsa Sho Da Zai, Dho Sya Da Sho Da Dho, Sa Ha Dza Ro Sho Da, Tsa Kho Zai Dho Ja Dza, Sho Ro Dho"
    },
    "1-11": {
        level: 1, page: 11,
        instruction: "Huruf THO & ZHO (ط ظ). Ada Tiang & Tebal.",
        rows: [
            ["طَ", "ظَ"],
            ["طَ", "اَ", "طَ", "بَ", "طَ", "ظَ"],
            ["طَ", "اَ", "حَ", "ظَ"],
            ["سَ", "ضَ", "طَ", "صَ", "دَ", "صَ"],
            ["شَ", "اَ", "ظَ", "سَ", "رَ", "صَ"],
            ["ثَ", "رَ", "ضَ", "زَ", "خَ", "زَ"],
            ["تَ", "ضَ", "طَ", "ظَ", "حَ", "ذَ"],
            ["صَ", "دَ", "شَ", "شَ", "جَ", "طَ"],
            ["رَ", "زَ", "سَ", "شَ", "صَ", "ضَ", "طَ", "ظَ"]
        ],
        expectedText: "Tho Zho, Tho A Tho Ba Tho Zho, Tho A Ha Zho, Sa Dho Tho Sho Da Sho, Sya A Zho Sa Ro Sho, Tsa Ro Dho Zai Kho Zai, Ta Dho Tho Zho Ha Dza, Sho Da Sya Sya Ja Tho, Ro Zai Sa Sya Sho Dho Tho Zho"
    },
    "1-12": {
        level: 1, page: 12,
        instruction: "Huruf 'AIN & GHOIN (ع غ). Kepala Burung.",
        rows: [
            ["عَ", "غَ"],
            ["غَ", "اَ", "عَ", "دَ", "غَ", "ظَ"],
            ["عَ", "اَ", "طَ", "غَ", "اَ", "عَ"],
            ["ثَ", "عَ", "ظَ", "جَ", "غَ", "ظَ"],
            ["سَ", "طَ", "عَ", "طَ", "غَ", "غَ"],
            ["حَ", "رَ", "ظَ", "شَ", "غَ", "ضَ"],
            ["صَ", "رَ", "عَ", "ضَ", "رَ", "غَ"],
            ["زَ", "خَ", "ظَ", "ضَ", "عَ", "دَ"],
            ["شَ", "رَ", "طَ", "طَ", "عَ", "ظَ"],
            ["طَ", "ظَ", "عَ", "غَ"]
        ],
        expectedText: "'Ain Ghoin, Gho A 'A Da Gho Zho, 'A A Tho Gho A 'A, Tsa 'A Zho Ja Gho Zho, Sa Tho 'A Tho Gho Gho, Ha Ro Zho Sya Gho Dho, Sho Ro 'A Dho Ro Gho, Zai Kho Zho Dho 'A Da, Sya Ro Tho Tho 'A Zho, Tho Zho 'A Gho"
    },
    "1-13": {
        level: 1, page: 13,
        instruction: "Huruf FA & QOF (ف ق). Kepala Bulat.",
        rows: [
            ["فَ", "قَ"],
            ["قَ", "بَ", "ضَ", "قَ", "طَ", "فَ"],
            ["قَ", "اَ", "رَ", "فَ", "قَ", "رَ"],
            ["ثَ", "غَ", "ظَ", "فَ", "قَ", "فَ"],
            ["سَ", "عَ", "فَ", "خَ", "لَ", "قَ"],
            ["حَ", "ذَ", "خَ", "قَ", "فَ", "صَ"],
            ["دَ", "اَ", "قَ", "صَ", "قَ", "رَ"],
            ["ضَ", "غَ", "طَ", "شَ", "فَ", "عَ"],
            ["زَ", "رَ", "قَ", "فَ", "تَ", "حَ"],
            ["غَ", "فَ", "قَ"]
        ],
        expectedText: "Fa Qof, Qo Ba Dho Qo Tho Fa, Qo A Ro Fa Qo Ro, Tsa Gho Zho Fa Qo Fa, Sa 'A Fa Kho La Qo, Ha Dza Kho Qo Fa Sho, Da A Qo Sho Qo Ro, Dho Gho Tho Sya Fa 'A, Zai Ro Qo Fa Ta Ha, Gho Fa Qo"
    },
    "1-14": {
        level: 1, page: 14,
        instruction: "Huruf KAF (ك). Bunyi Nipis Ada Angin.",
        rows: [
            ["كَ"],
            ["كَ", "حَ", "قَ", "كَ", "قَ", "خَ"],
            ["ضَ", "حَ", "كَ", "دَ", "حَ", "كَ"],
            ["جَ", "كَ", "تَ", "عَ", "طَ", "فَ"],
            ["شَ", "كَ", "رَ", "زَ", "كَ", "رَ"],
            ["صَ", "دَ", "ثَ", "قَ", "كَ", "فَ"],
            ["دَ", "غَ", "سَ", "صَ", "دَ", "قَ"],
            ["غَ", "فَ", "كَ", "زَ", "كَ", "طَ"],
            ["فَ", "قَ", "كَ"]
        ],
        expectedText: "Ka, Ka Ha Qo Ka Qo Kho, Dho Ha Ka Da Ha Ka, Ja Ka Ta 'A Tho Fa, Sya Ka Ro Zai Ka Ro, Sho Da Tsa Qo Ka Fa, Da Gho Sa Sho Da Qo, Gho Fa Ka Zai Ka Tho, Fa Qo Ka"
    },
    "1-15": {
        level: 1, page: 15,
        instruction: "Huruf LAM (ل). Mata Kail.",
        rows: [
            ["لَ"],
            ["قَ", "بَ", "لَ", "جَ", "عَ", "لَ"],
            ["خَ", "لَ", "طَ", "قَ", "بَ", "لَ"],
            ["دَ", "كَ", "رَ", "غَ", "لَ", "ظَ"],
            ["صَ", "فَ", "قَ", "فَ", "صَ", "لَ"],
            ["حَ", "لَ", "فَ", "دَ", "غَ", "سَ"],
            ["شَ", "كَ", "لَ", "دَ", "خَ", "لَ"],
            ["ضَ", "رَ", "عَ", "زَ", "تَ", "ظَ"],
            ["كَ", "لَ", "لَ", "لَ", "اَ", "لَ"],
            ["كَ", "لَ"]
        ],
        expectedText: "La, Qo Ba La Ja 'A La, Kho La Tho Qo Ba La, Da Ka Ro Gho La Zho, Sho Fa Qo Fa Sho La, Ha La Fa Da Gho Sa, Sya Ka La Da Kho La, Dho Ro 'A Zai Ta Zho, Ka La La La A La, Ka La"
    },
    "1-16": {
        level: 1, page: 16,
        instruction: "Huruf MIM (م). Bibir Rapat.",
        rows: [
            ["مَ"],
            ["غَ", "مَ", "ضَ", "لَ", "مَ", "سَ"],
            ["جَ", "مَ", "عَ", "حَ", "كَ", "مَ"],
            ["فَ", "رَ", "ضَ", "كَ", "رَ", "مَ"],
            ["خَ", "لَ", "طَ", "قَ", "مَ", "رَ"],
            ["صَ", "دَ", "مَ", "ظَ", "تَ", "ذَ"],
            ["مَ", "زَ", "قَ", "زَ", "عَ", "مَ"],
            ["شَ", "مَ", "لَ", "فَ", "كَ", "حَ"],
            ["غَ", "مَ", "مَ", "مَ", "لَ", "كَ"],
            ["لَ", "مَ"]
        ],
        expectedText: "Ma, Gho Ma Dho La Ma Sa, Ja Ma 'A Ha Ka Ma, Fa Ro Dho Ka Ro Ma, Kho La Tho Qo Ma Ro, Sho Da Ma Zho Ta Dza, Ma Zai Qo Zai 'A Ma, Sya Ma La Fa Ka Ha, Gho Ma Ma Ma La Ka, La Ma"
    },
    "1-17": {
        level: 1, page: 17,
        instruction: "Huruf NUN (ن). Mangkuk 1 Titik ATAS.",
        rows: [
            ["نَ"],
            ["نَ", "ظَ", "فَ", "نَ", "غَ", "شَ"],
            ["طَ", "عَ", "نَ", "مَ", "نَ", "عَ"],
            ["صَ", "مَ", "ضَ", "قَ", "رَ", "نَ"],
            ["خَ", "لَ", "قَ", "ذَ", "هَ", "بَ"],
            ["زَ", "مَ", "نَ", "كَ", "ذَ", "بَ"],
            ["جَ", "نَ", "دَ", "حَ", "سَ", "نَ"],
            ["كَ", "نَ", "سَ", "لَ", "حَ", "ظَ"],
            ["مَ", "نَ", "نَ", "شَ", "فَ", "qَ"],
            ["مَ", "نَ"]
        ],
        expectedText: "Na, Na Zho Fa Na Gho Sya, Tho 'A Na Ma Na 'A, Sho Ma Dho Qo Ro Na, Kho La Qo Dza Ha Ba, Zai Ma Na Ka Dza Ba, Ja Na Da Ha Sa Na, Ka Na Sa La Ha Zho, Ma Na Na Sya Fa Qo, Ma Na"
    },
    "1-18": {
        level: 1, page: 18,
        instruction: "Huruf WAU (و). Bibir Muncung Bulat.",
        rows: [
            ["وَ"],
            ["وَ", "زَ", "رَ", "وَ", "لَ", "غَ"],
            ["دَ", "وَ", "مَ", "قَ", "وَ", "دَ"],
            ["فَ", "طَ", "نَ", "قَ", "وَ", "مَ"],
            ["ظَ", "جَ", "عَ", "كَ", "وَ", "نَ"],
            ["سَ", "كَ", "تَ", "خَ", "وَ", "صَ"],
            ["شَ", "وَ", "لَ", "ذَ", "حَ", "ضَ"],
            ["وَ", "نَ", "وَ", "يَ", "دَ", "عَ"],
            ["نَ", "وَ"]
        ],
        expectedText: "Wa, Wa Zai Ro Wa La Gho, Da Wa Ma Qo Wa Da, Fa Tho Na Qo Wa Ma, Zho Ja 'A Ka Wa Na, Sa Ka Ta Kho Wa Sho, Sya Wa La Dza Ha Dho, Wa Na Wa Ya Da 'A, Na Wa"
    },
    "1-19": {
        level: 1, page: 19,
        instruction: "Huruf HA (هـ). Simpul. Bunyi Dalam Dada.",
        rows: [
            ["هَ"],
            ["هَ", "مَ", "شَ", "جَ", "هَ", "دَ"],
            ["دَ", "وَ", "هَ", "زَ", "هَ", "قَ"],
            ["فَ", "خَ", "عَ", "طَ", "هَ", "رَ"],
            ["وَ", "ضَ", "حَ", "كَ", "مَ", "نَ"],
            ["وَ", "هَ", "ظَ", "جَ", "هَ", "هَ"],
            ["سَ", "هَ", "لَ", "ذَ", "غَ", "صَ"],
            ["شَ", "هَ", "دَ", "غَ", "فَ", "رَ"],
            ["وَ", "هَ"]
        ],
        expectedText: "Ha, Ha Ma Sya Ja Ha Da, Da Wa Ha Zai Ha Qo, Fa Kho 'A Tho Ha Ro, Wa Dho Ha Ka Ma Na, Wa Ha Zho Ja Ha Ha, Sa Ha La Dza Gho Sho, Sya Ha Da Gho Fa Ro, Wa Ha"
    },
    "1-20": {
        level: 1, page: 20,
        instruction: "Huruf YA (ي). Bentuk Itik, 2 Titik Bawah.",
        rows: [
            ["يَ"],
            ["ضَ", "يَ", "رَ", "ضَ", "حَ", "يَ"],
            ["زَ", "يَ", "نَ", "يَ", "سَ", "رَ"],
            ["سَ", "يَ", "غَ", "وَ", "كَ", "لَ"],
            ["هَ", "يَ", "حَ", "مَ", "رَ", "ضَ"],
            ["طَ", "هَ", "ظَ", "شَ", "يَ", "عَ"],
            ["وَ", "قَ", "فَ", "هَ", "ى", "مَ"],
            ["جَ", "ذَ", "ثَ", "يَ", "دَ", "ى"],
            ["خَ", "حَ", "جَ", "ثَ", "تَ", "بَ", "اَ"],
            ["غَ", "عَ", "ظَ", "طَ", "ضَ", "صَ", "شَ", "سَ"],
            ["يَ", "هَ", "وَ", "نَ", "مَ", "لَ", "كَ", "قَ", "فَ"]
        ],
        expectedText: "Ya, Dho Ya Ro Dho Ha Ya, Zai Ya Na Ya Sa Ro, Sa Ya Gho Wa Ka La, Ha Ya Ha Ma Ro Dho, Tho Ha Zho Sya Ya 'A, Wa Qo Fa Ha A Ma, Ja Dza Tsa Ya Da A, Kho Ha Ja Tsa Ta Ba A, Gho 'A Zho Tho Dho Sho Sya Sa, Ya Ha Wa Na Ma La Ka Qo Fa"
    },
    // --- CORRECTED PAGES 21-30: STRICTLY SINGLE LETTERS (HURUF TUNGGAL) ---
    "1-21": {
        level: 1, page: 21,
        instruction: "Ujian Pengukuhan 1 (A - Zho). Baca satu persatu.",
        rows: [
            ["طَ", "تَ", "ثَ", "سَ", "شَ", "صَ"],
            ["جَ", "حَ", "خَ", "عَ", "غَ", "هَ"],
            ["دَ", "ذَ", "رَ", "زَ", "ضَ", "ظَ"],
            ["سَ", "شَ", "صَ", "ضَ", "طَ", "ظَ"],
            ["أَ", "بَ", "تَ", "ثَ", "جَ", "حَ"],
            ["خَ", "دَ", "ذَ", "رَ", "زَ", "و"]
        ],
        expectedText: "Tho Ta Tsa Sa Sya Sho, Ja Ha Kho 'A Gho Ha, Da Dza Ro Zai Dho Zho, Sa Sya Sho Dho Tho Zho, A Ba Ta Tsa Ja Ha, Kho Da Dza Ro Zai Wa"
    },
    "1-22": {
        level: 1, page: 22,
        instruction: "Ujian Pengukuhan 2 (Fa - Ya).",
        rows: [
            ["فَ", "قَ", "كَ", "لَ", "مَ", "نَ"],
            ["وَ", "هَ", "يَ", "فَ", "قَ", "كَ"],
            ["مَ", "نَ", "وَ", "هَ", "لَ", "يَ"],
            ["يَ", "نَ", "مَ", "لَ", "كَ", "قَ"],
            ["فَ", "غَ", "عَ", "ظَ", "طَ", "ضَ"],
            ["صَ", "شَ", "سَ", "زَ", "رَ", "ذَ"]
        ],
        expectedText: "Fa Qo Ka La Ma Na, Wa Ha Ya Fa Qo Ka, Ma Na Wa Ha La Ya, Ya Na Ma La Ka Qo, Fa Gho 'A Zho Tho Dho, Sho Sya Sa Zai Ro Dza"
    },
    "1-23": {
        level: 1, page: 23,
        instruction: "Latihan Huruf Berdekatan Bunyi.",
        rows: [
            ["قَ", "كَ", "قَ", "كَ", "قَ", "كَ"],
            ["جَ", "زَ", "جَ", "زَ", "جَ", "زَ"],
            ["ثَ", "سَ", "ثَ", "سَ", "ثَ", "سَ"],
            ["خَ", "غَ", "خَ", "غَ", "خَ", "غَ"],
            ["تَ", "طَ", "تَ", "طَ", "تَ", "طَ"],
            ["ذَ", "زَ", "ذَ", "زَ", "ذَ", "زَ"],
            ["أَ", "عَ", "أَ", "عَ", "أَ", "عَ"]
        ],
        expectedText: "Qo Ka Qo Ka Qo Ka, Ja Zai Ja Zai Ja Zai, Tsa Sa Tsa Sa Tsa Sa, Kho Gho Kho Gho Kho Gho, Ta Tho Ta Tho Ta Tho, Dza Zai Dza Zai Dza Zai, A 'A A 'A A 'A"
    },
    "1-24": {
        level: 1, page: 24,
        instruction: "Latihan Kombinasi 3 Huruf (Tunggal).",
        rows: [
            ["أَ", "مَ", "رَ"],
            ["سَ", "أَ", "لَ"],
            ["ك", "تَ", "بَ"],
            ["خَ", "رَ", "جَ"],
            ["ذَ", "هَ", "بَ"],
            ["حَ", "سَ", "دَ"],
            ["جَ", "عَ", "لَ"]
        ],
        expectedText: "A Ma Ro, Sa A La, Ka Ta Ba, Kho Ro Ja, Dza Ha Ba, Ha Sa Da, Ja 'A La"
    },
    "1-25": {
        level: 1, page: 25,
        instruction: "Latihan Kombinasi 3 Huruf (Rawak 1).",
        rows: [
            ["زَ", "عَ", "مَ"],
            ["غَ", "فَ", "رَ"],
            ["نَ", "صَ", "رَ"],
            ["ضَ", "رَ", "بَ"],
            ["قَ", "تَ", "لَ"],
            ["شَ", "ك", "رَ"],
            ["وَ", "جَ", "دَ"]
        ],
        expectedText: "Zai 'A Ma, Gho Fa Ro, Na Sho Ro, Dho Ro Ba, Qo Ta La, Sya Ka Ro, Wa Ja Da"
    },
    "1-26": {
        level: 1, page: 26,
        instruction: "Latihan Kombinasi 3 Huruf (Rawak 2).",
        rows: [
            ["خَ", "لَ", "قَ"],
            ["رَ", "زَ", "قَ"],
            ["عَ", "بَ", "دَ"],
            ["ظَ", "لَ", "مَ"],
            ["صَ", "بَ", "رَ"],
            ["حَ", "ك", "مَ"],
            ["سَ", "جَ", "دَ"]
        ],
        expectedText: "Kho La Qo, Ro Zai Qo, 'A Ba Da, Zho La Ma, Sho Ba Ro, Ha Ka Ma, Sa Ja Da"
    },
    "1-27": {
        level: 1, page: 27,
        instruction: "Ujian Kelancaran: Baca Laju (Kanan ke Kiri).",
        rows: [
            ["مَ", "لَ", "كَ", "وَ", "عَ", "دَ"],
            ["فَ", "سَ", "قَ", "لَ", "هَ", "بَ"],
            ["جَ", "عَ", "لَ", "كَ", "يَ", "دَ"],
            ["خَ", "شَ", "يَ", "هَ", "لَ", "عَ"],
            ["و", "قَ", "بَ", "عَ", "قَ", "دَ"],
            ["حَ", "سَ", "دَ", "خَ", "لَ", "قَ"]
        ],
        expectedText: "Ma La Ka Wa 'A Da, Fa Sa Qo La Ha Ba, Ja 'A La Ka Ya Da, Kho Sya Ya Ha La 'A, Wa Qo Ba 'A Qo Da, Ha Sa Da Kho La Qo"
    },
    "1-28": {
        level: 1, page: 28,
        instruction: "Latih Tubi Huruf (Baris Panjang).",
        rows: [
            ["أَ", "بَ", "تَ", "ثَ"],
            ["جَ", "حَ", "خَ"],
            ["دَ", "ذَ", "رَ", "زَ"],
            ["سَ", "شَ", "صَ"],
            ["ضَ", "طَ", "ظَ"],
            ["عَ", "غَ", "فَ"],
            ["قَ", "ك", "لَ"],
            ["مَ", "نَ", "وَ"],
            ["هَ", "ء", "يَ"]
        ],
        expectedText: "A Ba Ta Tsa, Ja Ha Kho, Da Dza Ro Zai, Sa Sya Sho, Dho Tho Zho, 'A Gho Fa, Qo Ka La, Ma Na Wa, Ha A Ya"
    },
    "1-29": {
        level: 1, page: 29,
        instruction: "Ujian Sebelum Tamat (Huruf Terpisah).",
        rows: [
            ["خَ", "تَ", "مَ", "عَ", "لَ", "ى"],
            ["ذَ", "هَ", "بَ", "جَ", "عَ", "لَ"],
            ["فَ", "تَ", "حَ", "نَ", "صَ", "رَ"],
            ["وَ", "لَ", "دَ", "كَ", "سَ", "بَ"],
            ["صَ", "دَ", "قَ", "كَ", "ذَ", "بَ"]
        ],
        expectedText: "Kho Ta Ma 'A La Ya, Dza Ha Ba Ja 'A La, Fa Ta Ha Na Sho Ro, Wa La Da Ka Sa Ba, Sho Da Qo Ka Dza Ba"
    },
    "1-30": {
        level: 1, page: 30,
        instruction: "UJIAN AKHIR IQRA 1 (Tamat). Semua Huruf.",
        rows: [
            ["ا", "ب", "ت", "ث", "ج", "ح", "خ"],
            ["د", "ذ", "ر", "ز", "س", "ش", "ص"],
            ["ض", "ط", "ظ", "ع", "غ", "ف", "ق"],
            ["ك", "ل", "م", "ن", "و", "هـ", "ي"],
            ["أَ", "لَ", "حَ", "مَ", "دَ", "لَ", "لَ", "هِ"]
        ],
        expectedText: "Alif Ba Ta Tsa Jim Ha Kho, Dal Dzal Ro Zai Sin Syin Sod, Dhod Tho Zho 'Ain Ghoin Fa Qof, Kaf Lam Mim Nun Wau Ha Ya, A La Ha Ma Da La La Hi"
    },

    // ================= IQRA 2 (HURUF SAMBUNG & MAD ASLI) =================
    "2-2": {
        level: 2, page: 2,
        instruction: "Asas Sambungan: Ba/Ta (Potong Ekor) vs Da/Ro/Wau (Pemutus).",
        rows: [
            ["بَ تَا", "بَ دَا"],
            ["تَ رَ", "تَ وَ"],
            ["تَ تَا", "تَ دَا", "بَ رَا", "بَ وَ"],
            ["بَ بَ", "بَ ذَ", "تَ رَ", "تَ زَ"],
            ["بَ ثَ", "تَ ذَ", "ثَ ثَ", "زَ ثَ"],
            ["بَ أَ", "بَ أَ تَ", "تَ أ", "تَ أ تَ"],
            ["طَ هَ", "جَ مَ", "كَ نَ", "سَ عَ"]
        ],
        expectedText: "Bataa Badaa, Taro Tawa, Tata Tada Baro Bawa, Baba Badza Taro Taza, Batsa Tadza Tsatsa Zatsa, Ba-A Ba-A-Ta Ta-A Ta-A-Ta, Thoha Jama Kana Sa'a"
    },
    "2-30": {
        level: 2, page: 30,
        instruction: "UJIAN AKHIR IQRA 2. Bacaan Mad & Sambungan.",
        rows: [
            ["كَتَبَ", "نَزَلَ", "ذَهَبَ"],
            ["خَلَقَ", "رَزَقَ", "جَعَلَ"],
            ["مَا", "كَا", "نَا"],
            ["يَا", "دَا", "رَا"],
            ["فَعَلَ", "فَاعَلَ", "فَعَالَا"]
        ],
        expectedText: "Kataba Nazala Zahaba, Kholaqo Rozaqo Ja'ala, Maa Kaa Naa, Yaa Daa Raa, Fa'ala Faa'ala Fa'aalaa"
    },

    // ================= IQRA 3 (KASRAH, DOMMAH & MAD) =================
    "3-2": {
        level: 3, page: 2,
        instruction: "Baris Bawah (Kasrah). Bunyi 'i'.",
        rows: [
            ["إِ", "بِ", "تِ", "ثِ"],
            ["جِ", "حِ", "خِ", "دِ"],
            ["بَ", "بِ", "تَ", "تِ"],
            ["بَابِ", "تَاتِ", "ثَاثِ"],
            ["خُتِمَ", "كُتِبَ", "ضُرِبَ"]
        ],
        expectedText: "I Bi Ti Tsi, Ji Hi Khi Di, Ba Bi Ta Ti, Baabi Taati Tsaatsi, Khutima Kutiba Dhuriba"
    },
    "3-10": {
        level: 3, page: 10,
        instruction: "Baris Depan (Dhommah). Bunyi 'u'.",
        rows: [
            ["أُ", "بُ", "تُ", "ثُ"],
            ["جُ", "حُ", "خُ", "دُ"],
            ["أَ إِ أُ", "بَ بِ بُ"],
            ["كُتُبٌ", "رُسُلٌ", "سُبُلٌ"],
            ["زُيِّنَ", "خُلِقَ", "نُزِّلَ"]
        ],
        expectedText: "U Bu Tu Tsu, Ju Hu Khu Du, A I U Ba Bi Bu, Kutubun Rusulun Subulun, Zuyyina Khuliqa Nuzzila"
    },
    "3-20": {
        level: 3, page: 20,
        instruction: "Mad Thabi'i (Panjang 2 Harakat). Wau Sukun & Ya Sukun.",
        rows: [
            ["بُو", "تُو", "ثُو"],
            ["بِي", "تِي", "ثِي"],
            ["قُولُوا", "تُوبُوا", "قُومُوا"],
            ["قِيلَ", "دِينِ", "تِينِ"],
            ["يَقُولُ", "يَتُوبُ", "يَصُومُ"]
        ],
        expectedText: "Buu Tuu Tsuu, Bii Tii Tsii, Quuluu Tuubuu Quumuu, Qiila Diini Tiini, Yaquulu Yatuubu Yashuumu"
    },

    // ================= IQRA 4 (TANWIN, SUKUN & QALQALAH) =================
    "4-1": {
        level: 4, page: 1,
        instruction: "Tanwin Atas (Fathatain). Bunyi 'an'.",
        rows: [
            ["اً", "بً", "تً", "ثً"],
            ["جً", "حً", "خً", "دً"],
            ["عَلِيمًا", "حَكِيمًا", "عَظِيمًا"],
            ["كِتَابًا", "رَسُولًا", "نَبِيًّا"],
            ["أَبَدًا", "أَحَدًا", "صَمَدًا"]
        ],
        expectedText: "An Ban Tan Tsan, Jan Han Khan Dan, 'Aliiman Hakiiman 'Azhiiman, Kitaaban Rasuulan Nabiyyan, Abadan Ahadan Shamadan"
    },
    "4-10": {
        level: 4, page: 10,
        instruction: "Tanda Mati (Sukun). Kunci mulut.",
        rows: [
            ["أَبْ", "أَتْ", "أَثْ"],
            ["أَجْ", "أَحْ", "أَخْ"],
            ["يَجْعَلُ", "يَضْحَكُ", "يَكْسِبُ"],
            ["تَعْلَمُونَ", "تَعْمَلُونَ", "تَشْكُرُونَ"],
            ["أَنْعَمْتَ", "غَضِبَ", "عَبَدْتَ"]
        ],
        expectedText: "Ab At Ats, Aj Ah Akh, Yaj'alu Yadh'aku Yaksibu, Ta'lamuuna Ta'maluuna Tasykuruuna, An'amta Ghadhiba 'Abadta"
    },
    "4-20": {
        level: 4, page: 20,
        instruction: "Qalqalah (Lantunan). Ba, Jim, Dal, Tho, Qof.",
        rows: [
            ["أَبْ", "أَجْ", "أَدْ", "أَطْ", "أَقْ"],
            ["يَقْتُلُ", "يَدْخُلُ", "يَطْبَعُ"],
            ["مُحِيطٌ", "مَجِيدٌ", "شَدِيدٌ"],
            ["فَلَقٍ", "خَلَقَ", "وَقَبَ"],
            ["حَبْلٌ", "كَسَبَ", "أَحَدٌ"]
        ],
        expectedText: "Ab Aj Ad Ath Aq, Yaqtulu Yadkhulu Yathba'u, Muhiithun Majiidun Syadiidun, Falaqin Khalaqa Waqaba, Hablun Kasaba Ahadun"
    },

    // ================= IQRA 5 (TASYDID & HAMZAH WASAL) =================
    "5-1": {
        level: 5, page: 1,
        instruction: "Tanda Sabdu (Tasydid). Tekan bunyi.",
        rows: [
            ["أَبَّ", "أَتَّ", "أَثَّ"],
            ["رَبُّكَ", "تَبَّتْ", "حَقُّ"],
            ["سَبَّحَ", "كَذَّبَ", "يُسَبِّحُ"],
            ["عَلَّمَ", "كَلَّمَ", "سَلَّمَ"],
            ["إِنَّ", "أَنَّ", "كَأَنَّ"]
        ],
        expectedText: "Abba Atta Atstsa, Rabbuka Tabbat Haqqu, Sabbaha Kazzaba Yusabbihu, 'Allama Kallama Sallama, Inna Anna Ka-anna"
    },
    "5-10": {
        level: 5, page: 10,
        instruction: "Alif Lam Qamariah (Jelas) vs Syamsiah (Masuk).",
        rows: [
            ["اَلْقَمَرُ", "اَلشَّمْسُ"],
            ["اَلْكِتَابُ", "اَلرَّحْمَنُ"],
            ["اَلْحَمْدُ", "اَلنَّاسُ"],
            ["اَلْعَالَمِينَ", "اَلضَّالِّينَ"],
            ["وَالْفَجْرِ", "وَالضُّحَى"]
        ],
        expectedText: "Al-Qamaru Asy-Syamsu, Al-Kitaabu Ar-Rahmanu, Al-Hamdu An-Naasu, Al-'Aalamiina Adh-Dhaalliina, Wal-Fajri Wadh-Dhuha"
    },
    "5-20": {
        level: 5, page: 20,
        instruction: "Waqaf (Berhenti). Matikan huruf akhir.",
        rows: [
            ["كِتَابٌ -> كِتَابْ", "رَحِيمٌ -> رَحِيمْ"],
            ["نَسْتَعِينُ -> نَسْتَعِينْ"],
            ["قَدِيرٌ -> قَدِيرْ"],
            ["وَالْعَصْرِ -> وَالْعَصْرْ"],
            ["أَحَدٌ -> أَحَدْ"]
        ],
        expectedText: "Kitaabun Kitaab, Rahiimun Rahiim, Nasta'iinu Nasta'iin, Qadiirun Qadiir, Wal-'Asri Wal-'Asr, Ahadun Ahad"
    },

    // ================= IQRA 6 (TAJWID PRAKTIKAL) =================
    "6-1": {
        level: 6, page: 1,
        instruction: "Nun Mati & Tanwin: Izhar Halqi (Jelas).",
        rows: [
            ["مَنْ ءَامَنَ", "عَذَابٌ أَلِيمٌ"],
            ["مِنْ هَادٍ", "سَلَامٌ هِيَ"],
            ["أَنْعَمْتَ", "يَنْحِتُونَ"],
            ["مِنْ خَوْفٍ", "عَلِيمٌ خَبِيرٌ"],
            ["مِنْ غِلٍّ", "قَوْلًا غَيْرَ"]
        ],
        expectedText: "Man Aamana 'Azaabun Aliim, Min Haadin Salaamun Hiya, An'amta Yanhituuna, Min Khaufin 'Aliimun Khabiir, Min Ghillin Qaulan Ghaira"
    },
    "6-5": {
        level: 6, page: 5,
        instruction: "Idgham Ma'al Ghunnah (Masuk dengung).",
        rows: [
            ["مَنْ يَقُولُ", "وُجُوهٌ يَوْمَئِذٍ"],
            ["مِنْ مَسَدٍ", "حَبْلٌ مِنْ"],
            ["مِنْ نِعْمَةٍ", "يَوْمَئِذٍ نَاعِمَةٌ"],
            ["مِنْ وَالٍ", "أَبِي لَهَبٍ وَتَبَّ"],
            ["لِمَنْ يَرَى", "خَيْرًا يَرَهُ"]
        ],
        expectedText: "May-yaquulu Wujuuhuy-yauma-izin, Mim-masadin Hablum-min, Min-ni'matin Yauma-izin Naa'imah, Miw-waalin Abii Lahabiw-watabba, Limay-yaraa Khairay-yarah"
    },
    "6-10": {
        level: 6, page: 10,
        instruction: "Ikhfa' Hakiki (Samar).",
        rows: [
            ["مِنْ دُونِ", "عِنْدَ"],
            ["مِنْ قَبْلِ", "يَنْقَلِبُ"],
            ["أَنْزَلَ", "مِنْ سِجِّيلٍ"],
            ["مِنْ شَرِّ", "رَسُولٌ كَرِيمٌ"],
            ["كُنْتُمْ", "مَنْثُورًا"]
        ],
        expectedText: "Min Duuni 'Inda, Min Qabli Yanqalibu, Anzala Min Sijjiilin, Min Syarri Rasuulun Kariim, Kuntum Man-tsuura"
    },
    "6-13": {
        level: 6, page: 13,
        instruction: "Latihan Akhir (Bacaan Panjang & Tanda Wakaf).",
        rows: [
            ["أَجْرٌ غَيْرُ مَمْنُونٍ", "إِلَى يَوْمِ يُبْعَثُونَ"],
            ["فِي جِيدِهَا حَبْلٌ", "فَمَالَهُۥ مِنْ هَادٍ"],
            ["يَمْشِي عَلَى بَطْنِهِۦ", "هَذَا لَشَيْءٌ عُجَابٌ"],
            ["يَخْطَفُ أَبْصَارَهُمْ", "لَلَبِثَ فِي بَطْنِهِۦ"],
            ["وَأَقْبَلَ بَعْضُهُمْ", "بِعِجْلٍ حَنِيذٍ"],
            ["فَوَسَطْنَ بِهِۦ جَمْعًا", "وَلَا يَخَافُ عُقْبَاهَا"],
            ["خَلَقَكُمْ أَطْوَارًا", "لَمْ يَلِدْ وَلَمْ يُولَدْ"]
        ],
        expectedText: "Ajrun Ghairu Mamnuunin Ilaa Yaumi Yub'atsuuna, Fii Jiidihaa Hablun Famaalahuu Min Haadin, Yamsyii 'Alaa Bathnihii Haadzaa Lasyai-un 'Ujaabun, Yakhthafu Abshaarahum Lalabitsa Fii Bathnihii, Wa-aqbala Ba'dhuhum Bi'ijlin Haniidzin, Fawashathna Bihii Jam'an Walaa Yakhaafu 'Uqbaahaa, Khalaqakum Athwaaran Lam Yalid Walam Yuulad"
    }
};
