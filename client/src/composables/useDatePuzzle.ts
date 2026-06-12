import { ref, computed, watch, onMounted } from 'vue';
import { apiClient } from '../api/client';

export type GameMode = 'date' | 'audio';

export interface PuzzleResult {
    id: string;
    mode: GameMode;
    year: number;
    month: number;
    day: number;
    correct: boolean;
    timestamp: number;
}

const numToHiragana = (num: number): string => {
    const units = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
    const unitsForTen = ['', 'いち', 'に', 'さん', 'し', 'ご', 'ろく', 'しち', 'はち', 'きゅう'];
    
    if (num < 10) return units[num];
    if (num === 10) return 'じゅう';
    if (num < 100) {
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return (tens > 1 ? units[tens] : '') + 'じゅう' + units[ones];
    }
    return num.toString(); // simplified for now
};

const getYearHiragana = (year: number): string => {
    let reading = '';
    if (year >= 1980 && year <= 1999) {
        reading += 'せんきゅうひゃく';
        const remainder = year - 1900;
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;
        if (tens > 0) reading += (tens > 1 ? numToHiragana(tens) : '') + 'じゅう';
        if (ones > 0) reading += numToHiragana(ones);
    } else if (year >= 2000 && year <= 2026) {
        reading += 'にせん';
        const remainder = year - 2000;
        if (remainder > 0) {
            reading += numToHiragana(remainder);
        }
    }
    return reading + 'ねん';
};

const getMonthHiragana = (month: number): string => {
    const months = ['', 'いちがつ', 'にがつ', 'さんがつ', 'しがつ', 'ごがつ', 'ろくがつ', 'しちがつ', 'はちがつ', 'くがつ', 'じゅうがつ', 'じゅういちがつ', 'じゅうにがつ'];
    return months[month];
};

const getDayHiragana = (day: number): string => {
    const specialDays: Record<number, string> = {
        1: 'ついたち', 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 
        6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか',
        14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか'
    };
    if (specialDays[day]) return specialDays[day];
    return numToHiragana(day) + 'にち';
};

export function useDatePuzzle() {
    const mode = ref<GameMode>('date');
    const history = ref<PuzzleResult[]>([]);

    const targetYear = ref<number>(1980);
    const targetMonth = ref<number>(1);
    const targetDay = ref<number>(1);

    const generateRandomDate = () => {
        targetYear.value = Math.floor(Math.random() * (2026 - 1980 + 1)) + 1980;
        targetMonth.value = Math.floor(Math.random() * 12) + 1;
        const daysInMonth = new Date(targetYear.value, targetMonth.value, 0).getDate();
        targetDay.value = Math.floor(Math.random() * daysInMonth) + 1;
    };

    const readingHiragana = computed(() => {
        return `${getYearHiragana(targetYear.value)} ${getMonthHiragana(targetMonth.value)} ${getDayHiragana(targetDay.value)}`;
    });

    const playAudioSequence = async (y = targetYear.value, m = targetMonth.value, d = targetDay.value) => {
        const play = (url: string) => new Promise<void>((resolve, reject) => {
            const audio = new Audio(url);
            audio.onended = () => resolve();
            audio.onerror = () => reject();
            audio.play().catch(reject);
        });

        try {
            await play(`/audio/dates/year_${y}.mp3`);
            await play(`/audio/dates/month_${m}.mp3`);
            await play(`/audio/dates/day_${d}.mp3`);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    };

    const loadHistory = () => {
        const saved = localStorage.getItem('datePuzzleHistory');
        if (saved) {
            history.value = JSON.parse(saved);
        }
    };

    const saveHistory = () => {
        localStorage.setItem('datePuzzleHistory', JSON.stringify(history.value));
    };

    const registerAttempt = (correct: boolean) => {
        history.value.push({
            id: Date.now().toString(),
            mode: mode.value,
            year: targetYear.value,
            month: targetMonth.value,
            day: targetDay.value,
            correct,
            timestamp: Date.now()
        });
        saveHistory();
    };

    const registerAccess = async () => {
        try {
            await apiClient.post('/api/date-puzzle/access');
        } catch (e) {
            console.error('Failed to log access', e);
        }
    };

    onMounted(() => {
        loadHistory();
        generateRandomDate();
    });

    return {
        mode,
        history,
        targetYear,
        targetMonth,
        targetDay,
        generateRandomDate,
        readingHiragana,
        playAudioSequence,
        registerAttempt,
        registerAccess
    };
}
