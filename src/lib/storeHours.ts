import { StoreHour } from "@/types/entities";
import { format } from "date-fns";

export interface StoreStatus {
    isOpen: boolean;
    status: 'open' | 'closed' | 'always_closed';
    message: string;
}

const DAYS_NAME = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
];

const DB_DAY_TO_NAME: Record<number, string> = {
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
    6: "Sábado",
    7: "Domingo"
};

export function isStoreOpenNow(hours: StoreHour[]): StoreStatus {
    if (!hours || hours.length === 0) {
        return { isOpen: false, status: 'closed', message: 'Carregando horários...' };
    }

    const now = new Date();
    
    // JS: 0=Sun, 1=Mon, ..., 6=Sat
    // DB: 1=Mon, 2=Tue, ..., 7=Sun
    const jsDay = now.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;

    const todayHours = hours.find(h => h.day_of_week === dbDay);

    if (!todayHours || !todayHours.is_open) {
        return { 
            isOpen: false, 
            status: 'always_closed', 
            message: `⚪ Fechado às ${DB_DAY_TO_NAME[dbDay]}` 
        };
    }

    const currentTimeStr = format(now, "HH:mm:ss");
    const openTime = todayHours.open_time;
    const closeTime = todayHours.close_time;
    
    // Before opening
    if (currentTimeStr < openTime) {
        return { 
            isOpen: false, 
            status: 'closed', 
            message: `Fechado agora - voltamos hoje às ${openTime.substring(0, 5)}` 
        };
    }

    // Is open
    if (currentTimeStr <= closeTime) {
        return { 
            isOpen: true, 
            status: 'open', 
            message: `Aberto agora - pedidos até ${closeTime.substring(0, 5)}` 
        };
    }

    // Already closed today
    const next = findNextOpening(hours, dbDay);
    return {
        isOpen: false,
        status: 'closed',
        message: `Fechado hoje - voltamos ${next?.day || 'em breve'} às ${next?.time || ''}`
    };
}

export function findNextOpening(hours: StoreHour[], currentDbDay: number) {
    const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);
    
    for (let i = 1; i <= 7; i++) {
        const nextDay = ((currentDbDay + i - 1) % 7) + 1;
        const h = sortedHours.find(sh => sh.day_of_week === nextDay);
        if (h && h.is_open) {
            const dayLabel = i === 1 ? "amanhã" : DB_DAY_TO_NAME[nextDay];
            return {
                day: dayLabel,
                time: h.open_time.substring(0, 5),
                daysOffset: i,
                dayOfWeek: nextDay
            };
        }
    }
    return null;
}

export function getNextStoreOpeningDate(hours: StoreHour[]): { date: Date, time: string } {
    const now = new Date();
    const jsDay = now.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;
    const status = isStoreOpenNow(hours);
    
    if (status.isOpen) {
        return { date: now, time: format(now, "HH:mm") };
    }
    
    // Check if it opens later TODAY
    const todayHours = hours.find(h => h.day_of_week === dbDay);
    const currentTimeStr = format(now, "HH:mm:ss");
    
    if (todayHours?.is_open && currentTimeStr < todayHours.open_time) {
        const d = new Date(now);
        return { date: d, time: todayHours.open_time.substring(0, 5) };
    }
    
    // Otherwise find next day
    const next = findNextOpening(hours, dbDay);
    if (next) {
        const d = new Date(now);
        d.setDate(d.getDate() + next.daysOffset);
        return { date: d, time: next.time };
    }
    
    return { date: now, time: "12:00" };
}
