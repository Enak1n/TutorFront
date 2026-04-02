import React, { useState } from 'react';
import { useAlert } from '@components/ui/alert/AlertContext';
import { AdminLessonData } from '@pages/AdminPage/AdminLessonCard';
import { deleteLesson } from '@api/schedule';
import { updateLessonStatus, updateLessonCompletedStatus } from '@api/admin';
// @ts-ignore
import styles from './AdminLessonCardModal.module.scss';

interface AdminLessonCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: AdminLessonData | null;
    onDeleteSuccess: (lessonId: string) => void;
    onStatusChangeSuccess: (lessonId: string, isAccepted: boolean, isCompleted: boolean) => void;
}

const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusLabel = (isAccepted: boolean, isCompleted: boolean): string => {
    if (isCompleted) return 'Завершено';
    if (isAccepted) return 'Подтверждено';
    return 'Ожидает подтверждения';
};

export const AdminLessonCardModal: React.FC<AdminLessonCardModalProps> = ({
                                                                              isOpen,
                                                                              onClose,
                                                                              lesson,
                                                                              onDeleteSuccess,
                                                                              onStatusChangeSuccess
                                                                          }) => {
    const { showAlert, showConfirm } = useAlert();
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !lesson) return null;

    const studentFullName = [lesson.firstName, lesson.lastName].filter(Boolean).join(' ') || 'Ученик';
    const studentUsername = lesson.username ? `@${lesson.username}` : '—';
    const isConfirmed = lesson.isAccepted;
    const isCompleted = lesson.isCompleted;
    const note = lesson.note;

    const handleDelete = async () => {
        showConfirm(
            `Вы уверены, что хотите удалить занятие "${studentFullName}"? Это действие необратимо.`,
            async () => {
                setIsLoading(true);
                try {
                    await deleteLesson(lesson.id);
                    onDeleteSuccess(lesson.id);
                    onClose();
                    showAlert('Занятие успешно удалено!', 'success');
                } catch (err) {
                    const serverMessage = (err as any).response?.data?.errorMessage;
                    const message = serverMessage || 'Не удалось удалить занятие.';
                    showAlert(message, 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    const handleStatusChange = async (newStatus: boolean) => {
        const action = newStatus ? 'подтвердить' : 'отменить подтверждение';

        showConfirm(
            `Вы уверены, что хотите ${action} занятие "${studentFullName}"?`,
            async () => {
                setIsLoading(true);
                try {
                    await updateLessonStatus({
                        id: lesson.id,
                        isAccepted: newStatus
                    });

                    onStatusChangeSuccess(lesson.id, newStatus, isCompleted);
                    showAlert(`Статус занятия успешно изменен: ${getStatusLabel(newStatus, isCompleted)}!`, 'success');
                    onClose();
                } catch (err) {
                    const message = (err as any).response?.data?.errorMessage || `Не удалось ${action} занятие.`;
                    showAlert(message, 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    const handleCompleteChange = async (newStatus: boolean) => {
        const action = newStatus ? 'завершить' : 'отменить завершение';

        showConfirm(
            `Вы уверены, что хотите ${action} занятие "${studentFullName}"?`,
            async () => {
                setIsLoading(true);
                try {
                    await updateLessonCompletedStatus({
                        id: lesson.id,
                        isCompleted: newStatus
                    });

                    onStatusChangeSuccess(lesson.id, lesson.isAccepted, newStatus);
                    showAlert(`Статус занятия успешно изменен: ${newStatus ? 'Завершено' : 'Активно'}!`, 'success');
                    onClose();
                } catch (err) {
                    const message = (err as any).response?.data?.errorMessage || `Не удалось ${action} занятие.`;
                    showAlert(message, 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    const durationMinutes = (new Date(lesson.endLessonDate).getTime() - new Date(lesson.startLessonDate).getTime()) / (1000 * 60);


    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} disabled={isLoading} aria-label="Закрыть модальное окно">
                    &times;
                </button>

                <h2 className={styles.modalTitle}>Информация о занятии</h2>

                <div className={styles.lessonDetails}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Студент:</span>
                        <span className={styles.detailValue}>{studentFullName} ({studentUsername})</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Дата и время:</span>
                        <span className={styles.detailValue}>{formatDateTime(lesson.startLessonDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Длительность:</span>
                        <span className={styles.detailValue}>{durationMinutes} мин</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Тип занятия:</span>
                        <span className={styles.detailValue}>{lesson.lessonType || '—'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Категория:</span>
                        <span className={styles.detailValue}>{lesson.lessonCategory || '—'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Статус:</span>
                        <span className={`${styles.detailValue} ${isConfirmed ? styles.statusGreen : styles.statusYellow}`}>
                            {getStatusLabel(isConfirmed, isCompleted)}
                        </span>
                    </div>
                    {note && (
                        <div className={styles.detailNote}>
                            <span className={styles.detailLabel}>Примечание:</span>
                            <p className={styles.noteText}>{note}</p>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${isCompleted ? styles.reopenButton : styles.completeButton}`}
                        onClick={() => handleCompleteChange(!isCompleted)}
                        disabled={isLoading}
                    >
                        {isCompleted ? 'Отменить завершение' : 'Пометить как завершено'}
                    </button>

                    <button
                        className={`${isConfirmed ? styles.rejectButton : styles.acceptButton}`}
                        onClick={() => handleStatusChange(!isConfirmed)}
                        disabled={isLoading || isCompleted}
                    >
                        {isConfirmed ? 'Отменить подтверждение' : 'Подтвердить занятие'}
                    </button>

                    <button
                        className={styles.deleteButton}
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        Удалить занятие
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