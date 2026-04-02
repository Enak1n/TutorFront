import React from 'react';
// @ts-ignore
import styles from './LessonCard.module.scss';
import { Lesson } from '@api/schedule';

interface LessonCardProps {
    lesson: Lesson;
    onCardClick: (lesson: Lesson) => void;
    isPast: boolean;
}

const getStatusClass = (lesson: Lesson): string => {
    const isCompleted = lesson.isCompleted;

    const now = new Date();
    const lessonStart = new Date(lesson.startLessonDate);
    const hasLessonStarted = lessonStart < now;
    if (isCompleted) {
        return styles.statusGray;
    }
    if (lesson.isAccepted) {
        return styles.statusGreen;
    }
    if (hasLessonStarted && !lesson.isAccepted) {
        return styles.statusRed;
    }

    if (!lesson.isAccepted) {
        return styles.statusYellow;
    }

    return styles.statusYellow;
};


export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onCardClick, isPast }) => {
    const startDate = new Date(lesson.startLessonDate);
    const endDate = new Date(lesson.endLessonDate);

    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const offsetMinutes = startDate.getMinutes();

    const cardPositionStyle: React.CSSProperties = {
        top: `${(offsetMinutes / 60) * 100}%`,
        height: `${(durationMinutes / 60) * 100}%`,
    };

    const statusClass = getStatusClass(lesson);

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const startTimeFormatted = formatTime(startDate);
    const endTimeFormatted = formatTime(endDate);
    const lessonData = lesson as any;

    const studentNameParts = [
        lessonData.firstName,
        lessonData.lastName
    ].filter(Boolean);

    const studentFullName = studentNameParts.join(' ');

    return (
        <div
            className={`${styles.lessonCard} ${statusClass} ${isPast ? styles.pastLesson : ''}`}
            style={cardPositionStyle}
            onClick={!isPast ? () => onCardClick(lesson) : undefined}
        >
            <div className={styles.timeInfo}>
                {startTimeFormatted} – {endTimeFormatted}
            </div>
            <div className={styles.mainInfo}>
                <div className={styles.studentName}>
                    {studentFullName || 'Ученик'}
                </div>
                <div className={styles.lessonDetails}>
                    {lesson.lessonType} ({lesson.lessonCategory})
                </div>
            </div>
        </div>
    );
};