"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
// @ts-ignore
import styles from "./WeeklyCalendar.module.scss"
import { LessonModal } from './LessonModal';
import { Lesson, getWeekLessons, getLessonById } from '@api/schedule';
import { LessonCard } from './LessonCard';

interface WeeklyCalendarProps {
    weekOffset: number
    userRole: "tutor" | "student_or_parent"
}

interface TimeSlot {
    hour: number
    label: string
}

interface DayColumn {
    date: Date
    dayName: string
    dayNumber: number
    isToday: boolean
}

const mapLessonsToCalendar = (lessons: Lesson[]): Record<string, Lesson[]> => {
    const lessonsMap: Record<string, Lesson[]> = {};

    lessons.forEach(lesson => {

        const isoString = lesson.startLessonDate.replace(' ', 'T');
        const lessonStart = new Date(isoString);


        const year = lessonStart.getFullYear();
        const month = String(lessonStart.getMonth() + 1).padStart(2, '0');
        const day = String(lessonStart.getDate()).padStart(2, '0');

        const lessonDateString = `${year}-${month}-${day}`;

        const startHour = lessonStart.getHours();

        const cellKey = `${lessonDateString}-${startHour}`;

        if (!lessonsMap[cellKey]) {
            lessonsMap[cellKey] = [];
        }
        lessonsMap[cellKey].push(lesson);
    });

    return lessonsMap;
};

export default function WeeklyCalendar({ weekOffset, userRole }: WeeklyCalendarProps) {
    const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);
    const [isLessonsError, setIsLessonsError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


    const timeSlots: TimeSlot[] = useMemo(() => {
        const slots: TimeSlot[] = []
        for (let hour = 8; hour <= 22; hour++) {
            slots.push({
                hour,
                label: `${hour.toString().padStart(2, "0")}:00`,
            })
        }
        return slots
    }, [])

    const weekDays: DayColumn[] = useMemo(() => {
        const today = new Date()
        const currentDay = today.getDay()
        const monday = new Date(today)

        // Находим понедельник текущей недели
        const diff = currentDay === 0 ? -6 : 1 - currentDay
        monday.setDate(today.getDate() + diff)

        // Добавляем offset недель
        monday.setDate(monday.getDate() + weekOffset * 7)

        const days: DayColumn[] = []
        const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)

            const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()

            days.push({
                date,
                dayName: dayNames[i],
                dayNumber: date.getDate(),
                isToday,
            })
        }

        return days
    }, [weekOffset])

    const weekPeriod = useMemo(() => {
        const firstDay = weekDays[0].date
        const lastDay = weekDays[6].date

        const monthNames = [
            "января",
            "февраля",
            "марта",
            "апреля",
            "мая",
            "июня",
            "июля",
            "августа",
            "сентября",
            "октября",
            "ноября",
            "декабря",
        ]

        if (firstDay.getMonth() === lastDay.getMonth()) {
            return `${firstDay.getDate()} - ${lastDay.getDate()} ${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()}`
        } else {
            return `${firstDay.getDate()} ${monthNames[firstDay.getMonth()]} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()]} ${firstDay.getFullYear()}`
        }
    }, [weekDays])


    const fetchLessons = useCallback(async () => {
        if (!userRole) {
            setLessonsMap({});
            return;
        }

        setIsLoadingLessons(true);
        setIsLessonsError(false);
        try {
            const data = await getWeekLessons(weekOffset);
            const mappedLessons = mapLessonsToCalendar(data);
            setLessonsMap(mappedLessons);
        } catch (error) {
            setIsLessonsError(true);
            setLessonsMap({});
        } finally {
            setIsLoadingLessons(false);
        }
    }, [weekOffset, userRole]);

    useEffect(() => {
        if (userRole) {
            fetchLessons();
        }
    }, [weekOffset, userRole, fetchLessons]);


    const handleCellClick = (day: DayColumn, timeSlot: TimeSlot) => {
        if (userRole === "tutor") {
            const dateWithTime = new Date(day.date);
            dateWithTime.setHours(timeSlot.hour, 0, 0, 0); // Устанавливаем точный час (например, 8:00)

            const now = new Date();
            const cutoffTime = new Date(dateWithTime.getTime() + 60 * 60 * 1000);

            // Сравниваем: если текущее время 'now' больше, чем 'cutoffTime', то ячейка в глубоком прошлом.
            if (now.getTime() > cutoffTime.getTime()) {
                return;
            }

            setModalInitialDate(dateWithTime);
            setIsModalOpen(true);
        }
    }

    const handleLessonClick = async (lesson: Lesson) => {
        const fullLesson = await getLessonById(lesson.id);
        if (fullLesson) {
            setSelectedLesson(fullLesson);
            setIsDetailsModalOpen(true);
        } else {
            setSelectedLesson(null);
        }

    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalInitialDate(null);
    }

    const handleCreateSuccess = (newLesson: Lesson) => {
        console.log("Успешно создано занятие:", newLesson);
        setIsModalOpen(false);
        setModalInitialDate(null);
        fetchLessons();
    }

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedLesson(null);
        fetchLessons();
    }

    const handleDeleteSuccess = (lessonId: string) => {
        console.log("Занятие удалено:", lessonId);
        setIsDetailsModalOpen(false);
        setSelectedLesson(null);
        fetchLessons();
    }

    const handleUpdateSuccess = (updatedLesson: Lesson) => {
        console.log("Занятие успешно обновлено:", updatedLesson);
        setIsDetailsModalOpen(false);
        setSelectedLesson(null);
        fetchLessons();
    }

    const getCellKey = (day: DayColumn, timeSlot: TimeSlot) => {

        const date = day.date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');

        const dateString = `${year}-${month}-${dayOfMonth}`;
        return `${dateString}-${timeSlot.hour}`
    }

    const allLessonsEmpty = Object.keys(lessonsMap).length === 0;

    let statusContent = null;

    return (
        <div className={styles.weeklyCalendar}>
            <div className={styles.weekPeriod}>
                <p className={styles.weekPeriodText}>{weekPeriod}</p>
            </div>

            <div className={styles.calendarCard}>
                <div className={styles.calendarScroll}>
                    <div className={styles.calendarGrid}>
                        <div className={styles.timeColumnWrapper}>
                            <div className={styles.timeColumn}>Время</div>
                            <div className={styles.timeLabelsColumn}>
                                {timeSlots.map((timeSlot) => (
                                    <div key={timeSlot.hour} className={styles.timeLabel}>
                                        <span className={styles.timeLabelText}>{timeSlot.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.daysWrapper}>
                                {weekDays.map((day, index) => (
                                    <div key={index} className={`${styles.dayColumn} ${day.isToday ? styles.today : ""}`}>
                                        <div className={styles.dayName}>{day.dayName}</div>
                                        <div className={styles.dayNumber}>{day.dayNumber}</div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.daysCellsWrapper}>

                                {(isLoadingLessons || isLessonsError || allLessonsEmpty) && statusContent}

                                {timeSlots.map((timeSlot) => (
                                    <div key={timeSlot.hour} className={styles.timeRow}>
                                        {weekDays.map((day, dayIndex) => {
                                            const cellKey = getCellKey(day, timeSlot)
                                            const cellLessons = lessonsMap[cellKey] || []

                                            const hasLessons = cellLessons.length > 0;

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    onClick={!hasLessons && userRole === "tutor" ? () => handleCellClick(day, timeSlot) : undefined}
                                                    className={`${styles.timeCell} ${
                                                        day.isToday ? styles.todayCell : ""
                                                    } ${userRole === "tutor" && !hasLessons ? styles.clickable : ""}`}
                                                >
                                                    {cellLessons.map((lesson) => {
                                                        const isPast = new Date().getTime() > new Date(lesson.endLessonDate).getTime();

                                                        return (
                                                            <LessonCard
                                                                key={lesson.id}
                                                                lesson={lesson as any}
                                                                onCardClick={handleLessonClick}
                                                                isPast={isPast}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.legendToday}`} />
                    <span>Сегодня</span>
                </div>

                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.legendYellow}`} />
                    <span>Ожидает подтверждения</span>
                </div>

                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.legendGreen}`} />
                    <span>Подтверждено</span>
                </div>

                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.legendRed}`} />
                    <span>Пропущено</span>
                </div>

                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.legendGray}`} />
                    <span>Завершено</span>
                </div>

                {userRole === "tutor" && (
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.legendClickable}`} />
                        <span>Нажмите на ячейку для добавления занятия</span>
                    </div>
                )}
            </div>

            {userRole === "tutor" && (
                <LessonModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    initialDate={modalInitialDate}
                    onCreateSuccess={handleCreateSuccess}
                    isReadOnly={false}
                />
            )}

            {isDetailsModalOpen && selectedLesson && (
                <LessonModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleDetailsModalClose}
                    initialDate={null}
                    lesson={selectedLesson}
                    isReadOnly={userRole !== "tutor"}
                    onDeleteSuccess={userRole === "tutor" ? handleDeleteSuccess : undefined}
                    onCreateSuccess={() => {}}
                    onUpdateSuccess={userRole === "tutor" ? handleUpdateSuccess : undefined}
                />
            )}
        </div>
    )
}
