import React from 'react';
import { AdminStatisticItem } from '@api/admin-statistic';
// @ts-ignore
import styles from './AdminStatisticPage.module.scss';
import { format } from 'date-fns';

interface StatisticCardProps {
    item: AdminStatisticItem;
    onClick: (item: AdminStatisticItem) => void;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({ item, onClick }) => {
    const statusClass = item.isPaid ? styles.statusGreen : styles.statusYellow;

    const formattedDate = format(new Date(item.enrollmentDate), 'dd.MM.yyyy');

    return (
        <div className={`${styles.statisticCard} ${statusClass}`}
             onClick={() => onClick(item)}
        >
            <div className={styles.cardHeader}>
                <span className={styles.statusLabel}>
                    {item.isPaid ? "Оплачено" : "Не оплачено"}
                </span>
                <span className={styles.dateLabel}>
                    Дата: {formattedDate}
                </span>
            </div>

            <div className={styles.personInfo}>
                <h3 className={styles.personTitle}>Репетитор</h3>
                <div className={styles.personDetails}>
                    <img src={item.tutor.photoUrl} alt={item.tutor.firstName} className={styles.photo} />
                    <span className={styles.name}>{item.tutor.firstName} {item.tutor.lastName}</span>
                    <span className={styles.username}>@{item.tutor.username}</span>
                </div>
            </div>

            <div className={styles.personInfo}>
                <h3 className={styles.personTitle}>Ученик</h3>
                <div className={styles.personDetails}>
                    <img src={item.student.photoUrl} alt={item.student.firstName} className={styles.photo} />
                    <span className={styles.name}>{item.student.firstName} {item.student.lastName}</span>
                    <span className={styles.username}>@{item.student.username}</span>
                </div>
            </div>

            <div className={styles.linkId}>
                ID занятия: {item.id.substring(0, 8)}...
            </div>
        </div>
    );
};