import { PrayerTimes } from '../types';

export const getPrayerTimes = async (lat: number, lng: number): Promise<PrayerTimes | null> => {
    try {
        // Method 3 is JAKIM (Jabatan Kemajuan Islam Malaysia)
        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);
        
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
        console.error("Failed to fetch prayer times", error);
        return null;
    }
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