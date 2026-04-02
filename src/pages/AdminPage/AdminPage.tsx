import React, { useState, useEffect, useCallback } from 'react';
import AdminDashboard from './AdminDashboard';
import { getTutorSchedulesByDay, TutorColumn } from '@api/admin';
// @ts-ignore
import styles from './AdminPage.module.scss';


export const AdminPage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tutorSchedules, setTutorSchedules] = useState<TutorColumn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSchedules = useCallback(async (date: Date) => {
        setIsLoading(true);
        setError(null);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        try {
            const data: TutorColumn[] = await getTutorSchedulesByDay(dateString); // 💡 Ожидаем новый тип
            setTutorSchedules(data);
        } catch (err) {
            console.error('Ошибка загрузки расписаний администратора:', err);
            setError('Не удалось загрузить расписания репетиторов.');
            setTutorSchedules([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules(currentDate);
    }, [currentDate, fetchSchedules]);

    const changeDay = (delta: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + delta);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const displayDate = currentDate.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });


    return (
        <div className={styles.adminPageContainer}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Загрузка репетиторов</h1>

                <div className={styles.calendarControls}>
                    <button
                        onClick={() => changeDay(-1)}
                        disabled={isLoading}
                        className={styles.navButton}
                        aria-label="Предыдущий день"
                    >
                        ←
                    </button>
                    <button
                        onClick={goToToday}
                        disabled={isLoading}
                        className={`${styles.navButton} ${styles.todayButton}`}
                    >
                        Сегодня
                    </button>
                    <button
                        onClick={() => changeDay(1)}
                        disabled={isLoading}
                        className={styles.navButton}
                        aria-label="Следующий день"
                    >
                        →
                    </button>
                    <h3 className={styles.currentDate}>{displayDate}</h3>
                </div>

                {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}

                <AdminDashboard
                    tutorSchedules={tutorSchedules}
                    isLoading={isLoading}
                    selectedDate={currentDate}
                />
            </div>
        </div>
    );
};