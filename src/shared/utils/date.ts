// Утилиты для календаря. Все функции работают в локальном времени браузера.

const MONTHS_NOMINATIVE = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const pad = (value: number) => String(value).padStart(2, '0');

/** YYYY-MM-DD без перевода в UTC. */
export const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** YYYY-MM для запросов к API. */
export const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const fromDateKey = (key: string) => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number) => {
    const result = startOfDay(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

/** Понедельник недели, в которую попадает дата. */
export const startOfWeek = (date: Date) => {
    const day = date.getDay();
    return addDays(date, day === 0 ? -6 : 1 - day);
};

/** Сколько недель между текущей неделей и неделей даты (для WeeklyCalendar.weekOffset). */
export const weekOffsetFromToday = (date: Date) =>
    Math.round((startOfWeek(date).getTime() - startOfWeek(new Date()).getTime()) / (7 * 24 * 60 * 60 * 1000));

/** Индекс дня недели, где понедельник = 0. */
export const mondayBasedDayIndex = (date: Date) => (date.getDay() + 6) % 7;

/** 42 дня (6 недель) сетки месяца, начиная с понедельника, включая хвосты соседних месяцев. */
export const getMonthGrid = (month: Date) => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

export const formatMonthTitle = (date: Date) => `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;

export const formatWeekTitle = (date: Date) => {
    const monday = startOfWeek(date);
    const sunday = addDays(monday, 6);
    const sameMonth = monday.getMonth() === sunday.getMonth();
    const start = monday.toLocaleDateString('ru-RU', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
    return `${start} — ${sunday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
};

export const formatDayTitle = (date: Date) => {
    const text = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/** «HH:mm» ↔ минуты от начала суток. */
export const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Сокращение «HH:mm:ss» → «HH:mm». */
export const shortTime = (time: string) => time.slice(0, 5);
