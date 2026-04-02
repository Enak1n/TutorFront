import React from 'react';
// @ts-ignore
import styles from './AdminDashboard.module.scss';

interface AdminLessonCardProps {
    lesson: any;
    onClick: (lesson: AdminLessonData) => void;
}

export interface LessonStatusData {
    isAccepted: boolean
    isCompleted: boolean;
    startLessonDate: string
}

export interface AdminLessonData extends LessonStatusData{
    id: string;
    lessonType?: string;
    lessonCategory?: string;
    isRepeated: boolean;
    isAccepted: boolean;
    isCompleted: boolean;
    startLessonDate: string
    endLessonDate: string;
    note?: string;

    firstName?: string | null;
    lastName?: string | null;
    username?: string;
}

const getStatusClass = (lesson: LessonStatusData): string => {
    const now = new Date();
    const lessonStart = new Date(lesson.startLessonDate);
    const hasLessonStarted = lessonStart.getTime() < now.getTime();

    if (lesson.isCompleted) {
        return styles.statusGray;
    }
    if (lesson.isAccepted) {
        return styles.statusGreen;
    }

    if (hasLessonStarted) {
        return styles.statusRed;
    }

    return styles.statusYellow;
};

export const AdminLessonCard: React.FC<AdminLessonCardProps> = ({ lesson, onClick }) => {
    const adminLesson = lesson as AdminLessonData;
    const startDate = new Date(adminLesson.startLessonDate);
    const endDate = new Date(adminLesson.endLessonDate);

    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const offsetMinutes = startDate.getMinutes();

    const cardPositionStyle: React.CSSProperties = {
        top: `${(offsetMinutes / 60) * 100}%`,
        height: `${(durationMinutes / 60) * 100}%`,
    };

    const statusClass = getStatusClass(adminLesson);

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const startTimeFormatted = formatTime(startDate);
    const endTimeFormatted = formatTime(endDate);

    const studentNameParts = [
        adminLesson.firstName,
        adminLesson.lastName
    ].filter(Boolean);

    const studentFullName = studentNameParts.join(' ');
    const studentUsername = adminLesson.username ? ` (@${adminLesson.username})` : '';

    return (
        <div
            className={`${styles.adminLessonCard} ${statusClass}`}
            style={cardPositionStyle}
            onClick={() => onClick(adminLesson)}
        >
            <div className={styles.studentName}>
                {studentFullName || 'Ученик'}
                {studentUsername}
            </div>
            <div className={styles.lessonType}>
                {adminLesson.lessonType || '—'}
            </div>
            <div className={styles.lessonTime}>
                {startTimeFormatted} - {endTimeFormatted}
            </div>
        </div>
    );
};