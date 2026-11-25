import React, { useCallback, useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';
import { getTutorSchedulesByDay, TutorColumn } from '@api/admin';
import { MonthCalendar } from '@components/layout/schedule/MonthCalendar';
import { CalendarToolbar, type CalendarView } from '@components/layout/schedule/CalendarToolbar';
import { addDays, addMonths, formatDayTitle, formatMonthTitle, isSameDay, startOfDay, toDateKey } from '../../shared/utils/date';
// @ts-ignore
import styles from './AdminPage.module.scss';

const VIEWS: CalendarView[] = ['month', 'day'];

export const AdminPage: React.FC = () => {
    const [view, setView] = useState<CalendarView>('month');
    const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
    const [tutorSchedules, setTutorSchedules] = useState<TutorColumn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSchedules = useCallback(async (date: Date) => {
        setIsLoading(true);
        setError(null);

        try {
            setTutorSchedules(await getTutorSchedulesByDay(toDateKey(date)));
        } catch (err) {
            console.error('Ошибка загрузки расписаний администратора:', err);
            setError('Не удалось загрузить расписания репетиторов.');
            setTutorSchedules([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'day') fetchSchedules(currentDate);
    }, [view, currentDate, fetchSchedules]);

    const today = new Date();
    const isTodayVisible =
        view === 'month'
            ? currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth()
            : isSameDay(currentDate, today);

    const shift = (direction: 1 | -1) =>
        setCurrentDate(date => (view === 'month' ? addMonths(date, direction) : addDays(date, direction)));

    const openDay = (date: Date) => {
        setCurrentDate(startOfDay(date));
        setView('day');
    };

    return (
        <div className={styles.adminPageContainer}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Загрузка репетиторов</h1>

                <div className={styles.calendarCard}>
                    <CalendarToolbar
                        views={VIEWS}
                        view={view}
                        onViewChange={setView}
                        title={view === 'month' ? formatMonthTitle(currentDate) : formatDayTitle(currentDate)}
                        onPrev={() => shift(-1)}
                        onNext={() => shift(1)}
                        onToday={() => setCurrentDate(startOfDay(new Date()))}
                        isTodayVisible={isTodayVisible}
                    />

                    {view === 'month' ? (
                        <MonthCalendar role='admin' month={currentDate} selectedDate={currentDate} onSelectDate={openDay} />
                    ) : (
                        <>
                            {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}
                            <AdminDashboard tutorSchedules={tutorSchedules} isLoading={isLoading} selectedDate={currentDate} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
