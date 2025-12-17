import { PrayerTimes } from '../types';

// Simplified Zone Mapping for Major Malaysian Regions
const MALAYSIA_ZONES = [
    { code: 'WLY01', name: 'Kuala Lumpur, Putrajaya', lat: 3.1390, lng: 101.6869 },
    { code: 'WLY02', name: 'Labuan', lat: 5.2831, lng: 115.2308 },
    { code: 'SGR01', name: 'Selangor (Gombak, Petaling, Sepang, etc)', lat: 3.0738, lng: 101.5183 },
    { code: 'JHR02', name: 'Johor Bahru, Kota Tinggi', lat: 1.4927, lng: 103.7414 },
    { code: 'KDH01', name: 'Kota Setar, Kubang Pasu, Pokok Sena', lat: 6.1184, lng: 100.3685 },
    { code: 'KTN01', name: 'Kota Bharu, Bachok, Pasir Puteh', lat: 6.1254, lng: 102.2381 },
    { code: 'MLK01', name: 'Melaka', lat: 2.1896, lng: 102.2501 },
    { code: 'NSN01', name: 'Seremban, Port Dickson', lat: 2.7258, lng: 101.9424 },
    { code: 'PHG02', name: 'Kuantan, Pekan, Rompin', lat: 3.8077, lng: 103.3260 },
    { code: 'PRK01', name: 'Tapah, Slim River, Tanjung Malim', lat: 4.2004, lng: 101.2668 }, // Approx
    { code: 'PRK02', name: 'Ipoh, Batu Gajah, Kampar', lat: 4.5975, lng: 101.0901 },
    { code: 'PLS01', name: 'Perlis', lat: 6.4449, lng: 100.2048 },
    { code: 'PNG01', name: 'Pulau Pinang', lat: 5.4141, lng: 100.3288 },
    { code: 'SBH01', name: 'Kota Kinabalu, Ranau', lat: 5.9804, lng: 116.0735 },
    { code: 'SWK01', name: 'Kuching, Bau, Lundu', lat: 1.5533, lng: 110.3592 },
    { code: 'TRG01', name: 'Kuala Terengganu, Marang', lat: 5.3117, lng: 103.1324 }
];

// Helper to find nearest zone
const getNearestZone = (lat: number, lng: number): string | null => {
    // Basic check if inside Malaysia roughly (Lat 1-8, Lng 99-120)
    if (lat < 0.5 || lat > 8 || lng < 99 || lng > 120) return null;

    let minDist = Infinity;
    let nearestCode = null;

    for (const zone of MALAYSIA_ZONES) {
        const dist = Math.sqrt(Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2));
        if (dist < minDist) {
            minDist = dist;
            nearestCode = zone.code;
        }
    }
    
    // If nearest is reasonably close (e.g. within ~2 degrees), use it.
    return minDist < 3.0 ? nearestCode : null;
};

// Fetch from E-Solat (JAKIM) using CORS Proxy
const fetchESolat = async (zone: string): Promise<PrayerTimes | null> => {
    try {
        const targetUrl = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}`;
        // Use corsproxy.io to bypass CORS and 403 blocks from direct browser requests
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
        
        if (!response.ok) throw new Error("E-Solat Network response was not ok");
        
        const data = await response.json();
        
        if (data.status !== "OK" || !data.prayerTime || data.prayerTime.length === 0) {
            throw new Error("Invalid E-Solat Data");
        }

        const pt = data.prayerTime[0];
        
        return {
            fajr: pt.fajr.substring(0, 5),
            sunrise: pt.syuruk.substring(0, 5),
            dhuhr: pt.dhuhr.substring(0, 5),
            asr: pt.asr.substring(0, 5),
            maghrib: pt.maghrib.substring(0, 5),
            isha: pt.isha.substring(0, 5),
            date: pt.date, // e.g., "27-Oct-2023"
            hijri: pt.hijri // e.g., "1445-04-12"
        };

    } catch (error) {
        console.warn("E-Solat fetch failed, falling back to global API...", error);
        return null;
    }
};

// Fallback to Aladhan (Global)
const fetchAladhan = async (lat: number, lng: number): Promise<PrayerTimes | null> => {
    try {
        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);
        
        // Method 3 = JAKIM (closest standard for Malaysia)
        // If outside Malaysia, you might want to auto-detect method, but sticking to 3 (Muslim World League) or 2 (ISNA) is common. 
        // We stick to 3 (MWL) or JAKIM specific ID if available in Aladhan, but standard MWL is safe fallback.
        // Actually Aladhan Method 11 is Majlis Ugama Islam Singapura, there isn't a specific JAKIM one in Aladhan standard list 
        // but Method 3 (Muslim World League) is a good general fallback.
        const response = await fetch(
            `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=3&iso8601=true`
        );
        
        const data = await response.json();
        const timings = data.data.timings;
        const hijri = data.data.date.hijri;

        return {
            fajr: timings.Fajr.split('T')[1].slice(0, 5),
            sunrise: timings.Sunrise.split('T')[1].slice(0, 5),
            dhuhr: timings.Dhuhr.split('T')[1].slice(0, 5),
            asr: timings.Asr.split('T')[1].slice(0, 5),
            maghrib: timings.Maghrib.split('T')[1].slice(0, 5),
            isha: timings.Isha.split('T')[1].slice(0, 5),
            date: data.data.date.readable,
            hijri: `${hijri.day} ${hijri.month.en} ${hijri.year}`
        };
    } catch (error) {
        console.error("Aladhan fetch failed", error);
        return null;
    }
};

export const getPrayerTimes = async (lat: number, lng: number): Promise<PrayerTimes | null> => {
    // 1. Try to find Malaysian Zone
    const zone = getNearestZone(lat, lng);

    if (zone) {
        console.log(`Detected Malaysia Zone: ${zone}. Fetching from E-Solat...`);
        const esolatData = await fetchESolat(zone);
        if (esolatData) {
            return esolatData;
        }
    }

    // 2. Fallback to Aladhan if e-solat fails or not in Malaysia
    console.log("Using Global Aladhan API...");
    return fetchAladhan(lat, lng);
};

export const getQiblaDirection = async (lat: number, lng: number): Promise<number> => {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
        const data = await response.json();
        return data.data.direction;
    } catch (error) {
        console.error("Failed to fetch Qibla", error);
        return 292; // Default approx direction for KL
    }
};