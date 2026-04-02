import React from 'react';
// @ts-ignore
import styles from './LessonCardStatistic.module.scss';
import { LessonStat } from '@api/person-statistic';

interface LessonCardStatisticProps {
    lesson: LessonStat;
    userRole: "tutor" | "student_or_parent";
}

const formatLessonDateTime = (isoDate: string): { date: string, time: string } => {
    const dateObj = new Date(isoDate);

    const date = dateObj.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const time = dateObj.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return { date, time };
};

const getStatusClass = (lesson: LessonStat): string => {
    const now = new Date();
    const lessonEnd = new Date(lesson.endLesson.replace(' ', 'T'));

    const hasLessonPassed = lessonEnd.getTime() < now.getTime();

    if (lesson.isCompleted) {
        return styles.statusGray;
    }
    if (hasLessonPassed && !lesson.isCompleted && !lesson.isAccepted) {
        return styles.statusRed;
    }

    if (lesson.isAccepted && !hasLessonPassed) {
        return styles.statusGreen;
    }
    if (!lesson.isAccepted && !hasLessonPassed) {
        return styles.statusYellow;
    }

    return styles.statusGray;
};

export const LessonCardStatistic: React.FC<LessonCardStatisticProps> = ({ lesson, userRole }) => {
    const statusClass = getStatusClass(lesson);
    const { date: startDate, time: startTime } = formatLessonDateTime(lesson.startLesson);
    const { time: endTime } = formatLessonDateTime(lesson.endLesson);

    const lessonEnd = new Date(lesson.endLesson.replace(' ', 'T'));
    const isPastLesson = lessonEnd.getTime() < new Date().getTime();
    const pastClass = isPastLesson ? styles.pastLesson : '';

    const lessonPartner = userRole === "tutor" ? lesson.student : lesson.tutor;
    const partnerRoleName = userRole === "tutor" ? "Студент" : "Репетитор";

    const statusText = lesson.isCompleted ? 'Да' : (lesson.isAccepted ? 'Да' : 'Нет');

    let statusLabelText;
    if (lesson.isCompleted) {
        statusLabelText = 'Завершено';
    } else if (lesson.isAccepted) {
        statusLabelText = 'Подтверждено';
    } else if (isPastLesson) {
        statusLabelText = 'Пропущено';
    } else {
        statusLabelText = 'Ожидает';
    }

    return (
        <div className={`${styles.cardContainer} ${statusClass} ${pastClass}`}>
            <div className={styles.header}>
                <span className={styles.category}>{lesson.lessonType} — {lesson.lessonCategory}</span>
                <span className={styles.statusIndicator}>
                    {statusLabelText}
                </span>
            </div>
            <div className={styles.personInfo}>
                <div className={styles.personTitle}>
                    <p className={styles.detailLabel}>{partnerRoleName}</p>
                </div>
                <div className={styles.personDetails}>
                    <img
                        src={lessonPartner.photoUrl}
                        alt={lessonPartner.firstName}
                        className={styles.photo}
                    />
                    <div className={styles.personText}>
                        <p className={styles.name}>{lessonPartner.firstName} {lessonPartner.lastName}</p>
                    </div>
                </div>
            </div>

            <div className={styles.details}>
                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>📅 Дата</p>
                    <p className={styles.detailValue}>{startDate}</p>
                </div>
                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>⏱️ Время</p>
                    <p className={styles.detailValue}>{startTime} - {endTime}</p>
                </div>

                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>✅ Принято</p>
                    <p className={styles.detailValue}>{statusText}</p>
                </div>
                <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>🏁 Выполнено</p>
                    <p className={styles.detailValue}>{lesson.isCompleted ? 'Да' : 'Нет'}</p>
                </div>
            </div>
            {lesson.note && (
                <div className={styles.note}>
                    <p className={styles.noteLabel}>🗒️ Примечание</p>
                    <p className={styles.noteText}>{lesson.note}</p>
                </div>
            )}
        </div>
    );
};