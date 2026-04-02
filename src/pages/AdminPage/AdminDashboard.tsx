import React, { useMemo, useState, useEffect } from 'react';
import { TutorColumn } from '@api/admin';
import { Lesson } from '@api/schedule';
// @ts-ignore
import styles from './AdminDashboard.module.scss';
import { AdminLessonCard, AdminLessonData } from './AdminLessonCard'
import { AdminLessonCardModal } from '@components/admin/LessonCardModal/AdminLessonCardModal';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif'


interface AdminDashboardProps {
    tutorSchedules: TutorColumn[];
    isLoading: boolean;
    selectedDate: Date;
}

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tutorSchedules: initialTutorSchedules, isLoading, selectedDate }) => {

    const [tutorSchedules, setTutorSchedules] = useState(initialTutorSchedules);
    useEffect(() => {
        setTutorSchedules(initialTutorSchedules);
    }, [initialTutorSchedules]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<AdminLessonData | null>(null);

    const [highlightedTime, setHighlightedTime] = useState<string | null>(null);
    const [highlightedTutorId, setHighlightedTutorId] = useState<string | null>(null);

    const handleCardClick = (lesson: AdminLessonData) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedLesson(null);
    };

    const handleTimeClick = (timeSlot: string) => {
        setHighlightedTime(prev => (prev === timeSlot ? null : timeSlot));
        setHighlightedTutorId(null);
    };

    const handleTutorClick = (tutorId: string) => {
        setHighlightedTutorId(prev => (prev === tutorId ? null : tutorId));
        setHighlightedTime(null);
    };

    const handleLessonDeleteSuccess = (deletedLessonId: string) => {
        setTutorSchedules(prevSchedules =>
            prevSchedules.map(column => ({
                ...column,
                lessons: column.lessons.filter(l => l.id !== deletedLessonId)
            }))
        );
    };

    const handleStatusChangeSuccess = (lessonId: string, newIsAccepted: boolean, newIsCompleted: boolean) => {
        setTutorSchedules(prevSchedules =>
            prevSchedules.map(column => ({
                ...column,
                lessons: column.lessons.map(l =>
                    l.id === lessonId
                        ? {
                            ...l,
                            isAccepted: newIsAccepted,
                            isCompleted: newIsCompleted
                        } as Lesson
                        : l
                )
            }))
        );
    };



    const scheduleGrid = useMemo(() => {
        if (!tutorSchedules.length) return {};
        const grid: Record<string, Record<string, Lesson[]>> = {};

        for (const column of tutorSchedules) {
            const tutorId = column.tutor.id;

            for (const timeSlot of TIME_SLOTS) {
                const slotHour = parseInt(timeSlot.split(':')[0]); // 8, 9, 10...

                if (!grid[timeSlot]) {
                    grid[timeSlot] = {};
                }

                const slotDate = new Date(selectedDate);

                slotDate.setHours(slotHour, 0, 0, 0);
                const slotStart = slotDate.getTime();
                const slotEnd = slotStart + 60 * 60 * 1000;

                const slotLessons = column.lessons.filter(lesson => {
                    const lessonStart = new Date(lesson.startLessonDate).getTime();
                    //const lessonEnd = new Date(lesson.endLessonDate).getTime();

                    return (
                        lessonStart >= slotStart &&
                        lessonStart < slotEnd
                    );
                });

                grid[timeSlot][tutorId] = slotLessons;
            }
        }
        return grid;
    }, [tutorSchedules, selectedDate]);


    const tutorHeaders = tutorSchedules.map(c => ({
        id: c.tutor.id,
        name: `${c.tutor.firstName} ${c.tutor.lastName || ''}`
    }));

    if (isLoading && tutorSchedules.length === 0) {
        return (
            <div
                className={styles.loading}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <img
                    src={loading_list}
                    alt="Загрузка календаря..."
                    style={{
                        width: '80px',
                        height: '80px',
                        marginBottom: '10px'
                    }}
                />
                <div>Загрузка календаря...</div>
            </div>
        );
    }

    if (tutorSchedules.length === 0) {
        return <p>Нет данных о расписании репетиторов на этот день.</p>;
    }

    return (
        <div className={styles.adminDashboardCalendar}>

            <div className={styles.calendarCard}>

                    <div className={styles.calendarGrid}>

                        <div className={styles.timeColumnWrapper}>
                            <div className={styles.timeColumnHeader}>Время</div>

                            <div className={styles.timeLabelsColumn}>
                                {TIME_SLOTS.map((timeSlot) => (
                                    <div
                                        key={timeSlot}
                                        className={`${styles.timeLabel} ${highlightedTime === timeSlot ? styles.isHighlighted : ''}`}
                                        onClick={() => handleTimeClick(timeSlot)}
                                    >
                                        <span className={styles.timeLabelText}>{timeSlot}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.calendarScroll}>


                        <div style={{ flex: 1, minWidth: 0 }}>

                            <div className={styles.tutorHeadersWrapper}>
                                {tutorHeaders.map(tutor => (
                                    <div
                                        key={tutor.id}
                                        className={`${styles.tutorHeaderCell} ${highlightedTutorId === tutor.id ? styles.isHighlighted : ''}`}
                                        onClick={() => handleTutorClick(tutor.id)}
                                    >
                                        <strong>{tutor.name}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.daysCellsWrapper}>
                                {TIME_SLOTS.map(timeSlot => (
                                    <div
                                        key={timeSlot}
                                        className={`${styles.timeRow} ${highlightedTime === timeSlot ? styles.isHighlightedRow : ''}`}
                                    >
                                        {tutorHeaders.map(tutor => {
                                            const lessons = scheduleGrid[timeSlot]?.[tutor.id] || [];
                                            const isBusy = lessons.length > 0;

                                            return (
                                                <div
                                                    key={tutor.id}
                                                    className={`${styles.dataCell} ${styles.cellHeight} 
                                                                ${isBusy ? styles.relativeContainer : ''}
                                                                ${highlightedTutorId === tutor.id ? styles.isHighlightedColumn : ''}
                                                                `}
                                                    >
                                                    {lessons.map((lesson) => (
                                                        <AdminLessonCard
                                                            key={lesson.id}
                                                            lesson={lesson}
                                                            onClick={handleCardClick}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                    </div>
            </div>
            {selectedLesson && (
                <AdminLessonCardModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    lesson={selectedLesson}
                    onDeleteSuccess={handleLessonDeleteSuccess}
                    onStatusChangeSuccess={handleStatusChangeSuccess}
                />
            )}

        </div>
    );
};

export default AdminDashboard;