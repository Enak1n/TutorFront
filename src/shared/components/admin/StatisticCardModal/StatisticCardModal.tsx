import React, { useState } from 'react';
import { useAlert } from '@components/ui/alert/AlertContext';
import { AdminStatisticItem, updatePaymentStatus } from '@api/admin-statistic';
import { format } from 'date-fns';
// @ts-ignore
import styles from './StatisticCardModal.module.scss';

interface StatisticCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AdminStatisticItem | null;
    onStatusChangeSuccess: (itemId: string, isPaid: boolean) => void;
}

export const StatisticCardModal: React.FC<StatisticCardModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          item,
                                                                          onStatusChangeSuccess
                                                                      }) => {
    const { showAlert, showConfirm } = useAlert();
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !item) return null;

    const isCurrentlyPaid = item.isPaid;
    const formattedDate = format(new Date(item.enrollmentDate), 'dd.MM.yyyy HH:mm');

    const handleStatusChange = async (newStatus: boolean) => {
        const action = newStatus ? 'Оплачено' : 'Не оплачено';
        const actionVerb = newStatus ? 'подтвердить' : 'отменить';

        showConfirm(
            `Вы уверены, что хотите ${actionVerb} статус оплаты на "${action}"?`,
            async () => {
                setIsLoading(true);
                try {
                    await updatePaymentStatus({
                        id: item.id,
                        isPaid: newStatus
                    });

                    onStatusChangeSuccess(item.id, newStatus);
                    showAlert(`Статус оплаты успешно изменен на "${action}"!`, 'success');
                    onClose();
                } catch (err) {
                    const message = (err as any).response?.data?.errorMessage || `Не удалось изменить статус оплаты.`;
                    showAlert(message, 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    const getPersonDetails = (person: AdminStatisticItem['tutor'] | AdminStatisticItem['student'], title: string) => (
        <div className={styles.personInfo}>
            <h3 className={styles.personTitle}>{title}</h3>
            <div className={styles.personDetails}>
                <img src={person.photoUrl} alt={person.firstName} className={styles.photo} />
                <span className={styles.name}>{person.firstName} {person.lastName}</span>
                <span className={styles.username}>@{person.username}</span>
            </div>
        </div>
    );


    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} disabled={isLoading} aria-label="Закрыть модальное окно">
                    &times;
                </button>

                <h2 className={styles.modalTitle}>Детали оплаты</h2>

                <div className={styles.detailsSection}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>ID Записи:</span>
                        <span className={styles.detailValue}>{item.id}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Дата записи:</span>
                        <span className={styles.detailValue}>{formattedDate}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Текущий статус:</span>
                        <span className={`${styles.detailValue} ${isCurrentlyPaid ? styles.statusGreen : styles.statusYellow}`}>
                            {isCurrentlyPaid ? "ОПЛАЧЕНО" : "НЕ ОПЛАЧЕНО"}
                        </span>
                    </div>
                </div>

                {getPersonDetails(item.tutor, 'Репетитор')}
                {getPersonDetails(item.student, 'Ученик')}

                <div className={styles.actions}>
                    <button
                        className={`${isCurrentlyPaid ? styles.setUnpaidButton : styles.setPaidButton}`}
                        onClick={() => handleStatusChange(!isCurrentlyPaid)}
                        disabled={isLoading}
                    >
                        {isCurrentlyPaid ? 'Сменить на "Не оплачено"' : 'Сменить на "Оплачено"'}
                    </button>

                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Закрыть
                    </button>
                </div>
                {isLoading && <div className={styles.loadingOverlay}>Загрузка...</div>}
            </div>
        </div>
    );
};