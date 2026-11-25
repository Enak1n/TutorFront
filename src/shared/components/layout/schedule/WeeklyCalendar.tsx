"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
// @ts-ignore
import styles from "./WeeklyCalendar.module.scss"
import { LessonModal } from './LessonModal';
import { Lesson, getWeekLessons, getLessonById } from '@api/schedule';
import { LessonCard } from './LessonCard';
import { getAvailability } from "@api/availability";
import { minutesToTime, shortTime, timeToMinutes, toDateKey, toMonthKey } from "../../../utils/date";

/** Свободное окно репетитора в минутах от начала суток (время МСК). */
interface FreeWindow {
    start: number
    end: number
}

interface WeeklyCalendarProps {
    weekOffset: number
    userRole: "tutor" | "student_or_parent"
    /** Показать только один день недели (0 = понедельник) — режим «День». */
    dayIndex?: number
    /** Изменение значения перезагружает занятия. */
    refreshKey?: number
    /** Вызывается после создания/изменения/удаления занятия. */
    onLessonsChanged?: () => void
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

export default function WeeklyCalendar({ weekOffset, userRole, dayIndex, refreshKey = 0, onLessonsChanged }: WeeklyCalendarProps) {
    const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
    const [freeWindows, setFreeWindows] = useState<Record<string, FreeWindow[]>>({});
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

    const visibleDays = dayIndex === undefined ? weekDays : weekDays.slice(dayIndex, dayIndex + 1)


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
    }, [weekOffset, userRole, fetchLessons, refreshKey]);

    // Свободные окна показываем репетитору штриховкой прямо в сетке.
    useEffect(() => {
        if (userRole !== "tutor") {
            setFreeWindows({});
            return;
        }

        let cancelled = false;
        const months = Array.from(new Set([toMonthKey(weekDays[0].date), toMonthKey(weekDays[6].date)]));

        Promise.all(months.map(month => getAvailability(month).catch(() => []))).then(results => {
            if (cancelled) return;

            const byDate: Record<string, FreeWindow[]> = {};
            results.flat().forEach(slot => {
                (byDate[slot.date] ??= []).push({
                    start: timeToMinutes(shortTime(slot.startTime)),
                    end: timeToMinutes(shortTime(slot.endTime)),
                });
            });
            setFreeWindows(byDate);
        });

        return () => {
            cancelled = true;
        };
    }, [weekDays, userRole, refreshKey]);

    /** Части окон, попадающие в часовую ячейку, — в процентах от высоты ячейки. */
    const getFreeSegments = (date: Date, hour: number) => {
        const cellStart = hour * 60;
        const cellEnd = cellStart + 60;

        return (freeWindows[toDateKey(date)] ?? [])
            .map(window => ({ window, from: Math.max(window.start, cellStart), to: Math.min(window.end, cellEnd) }))
            .filter(segment => segment.to > segment.from)
            .map(segment => ({
                top: ((segment.from - cellStart) / 60) * 100,
                height: ((segment.to - segment.from) / 60) * 100,
                isWindowStart: segment.from === segment.window.start,
                isWindowEnd: segment.to === segment.window.end,
                label: `свободно ${minutesToTime(segment.window.start)}–${minutesToTime(segment.window.end)}`,
            }));
    };


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
        onLessonsChanged?.();
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
        onLessonsChanged?.();
    }

    const handleUpdateSuccess = (updatedLesson: Lesson) => {
        console.log("Занятие успешно обновлено:", updatedLesson);
        setIsDetailsModalOpen(false);
        setSelectedLesson(null);
        fetchLessons();
        onLessonsChanged?.();
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
            <div className={styles.calendarCard}>
                <div className={styles.calendarScroll}>
                    <div className={`${styles.calendarGrid} ${dayIndex !== undefined ? styles.singleDay : ""}`}>
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
                                {visibleDays.map((day, index) => (
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
                                        {visibleDays.map((day, dayIndex) => {
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
                                                    {getFreeSegments(day.date, timeSlot.hour).map((segment, segmentIndex) => (
                                                        <div
                                                            key={segmentIndex}
                                                            className={[
                                                                styles.freeSlot,
                                                                segment.isWindowStart ? styles.freeSlotStart : "",
                                                                segment.isWindowEnd ? styles.freeSlotEnd : "",
                                                            ].join(" ")}
                                                            style={{ top: `${segment.top}%`, height: `${segment.height}%` }}
                                                            title={segment.label}
                                                        >
                                                            {segment.isWindowStart && (
                                                                <span className={styles.freeSlotLabel}>{segment.label}</span>
                                                            )}
                                                        </div>
                                                    ))}
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
                        <div className={`${styles.legendColor} ${styles.legendFree}`} />
                        <span>Свободное время</span>
                    </div>
                )}

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
