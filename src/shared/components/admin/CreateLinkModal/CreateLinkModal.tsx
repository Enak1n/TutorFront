import React, { useState, useMemo } from 'react';
import { UserBase, CreateLinkPayload, TutorStudentLink  } from '@api/admin-links';
import { CustomSelect, SelectOption } from '@components/ui/select/CustomSelect';
// @ts-ignore
import styles from './CreateLinkModal.module.scss';

interface CreateLinkModalProps {
    tutors: UserBase[];
    students: UserBase[];
    onClose: () => void;
    onCreate: (payload: CreateLinkPayload) => Promise<void>;
    editingLink: TutorStudentLink | null;
    onUpdate: (linkId: string, paymentDetails: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
                                                                    tutors,
                                                                    students,
                                                                    onClose,
                                                                    onCreate,
                                                                    onUpdate,
                                                                    editingLink,
                                                                    isLoading,
                                                                    error,
                                                                }) => {
    const formatUserName = (user: UserBase) =>
        `${user.firstName} ${user.lastName || ''} (@${user.username})`;
    const isEditing = !!editingLink;
    const [selectedTutorOption, setSelectedTutorOption] = useState<SelectOption | null>(
        isEditing ? {
            value: editingLink.tutor.id,
            label: formatUserName(editingLink.tutor)
        } : null
    );
    const [selectedStudentOption, setSelectedStudentOption] = useState<SelectOption | null>(
        isEditing ? {
            value: editingLink.student.id,
            label: formatUserName(editingLink.student)
        } : null
    );
    const [paymentDetails, setPaymentDetails] = useState<string>(
        editingLink?.paymentDetails || ''
    );
    const [localError, setLocalError] = useState<string | null>(null);

    const tutorOptions: SelectOption[] = useMemo(() => tutors.map(t => ({
        value: t.id,
        label: formatUserName(t)
    })), [tutors]);

    const studentOptions: SelectOption[] = useMemo(() => students.map(s => ({
        value: s.id,
        label: formatUserName(s)
    })), [students]);

    const selectedTutorId = selectedTutorOption?.value;
    const selectedStudentId = selectedStudentOption?.value;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (isEditing) {
            try {
                await onUpdate(editingLink.id, paymentDetails.trim());
            } catch (e) {
                console.error('Ошибка при обновлении оплаты:', e);
            }
            return;
        }

        if (!selectedTutorId || !selectedStudentId) {
            setLocalError('Пожалуйста, выберите репетитора и студента.');
            return;
        }

        try {
            await onCreate({
                tutorId: selectedTutorId,
                studentId: selectedStudentId,
                paymentDetails: paymentDetails.trim()
            });
        } catch (e) {
            console.error('Ошибка при создании связи:', e);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть модальное окно">
                    &times;
                </button>
                <h2 className={styles.modalTitle}>
                    {isEditing ? 'Редактирование оплаты' : 'Создание новой связи'}
                </h2>

                {(error || localError) && <p className={styles.errorText}>{error || localError}</p>}

                <form onSubmit={handleSubmit}>

                    <div className={styles.formGroup}>
                        <label htmlFor="tutorId">
                            Репетитор:
                            <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <CustomSelect
                            id="tutorId"
                            value={selectedTutorOption}
                            onChange={setSelectedTutorOption}
                            options={tutorOptions}
                            placeholder="Выберите репетитора"
                            isDisabled={isLoading || isEditing || tutorOptions.length === 0}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="studentId">
                            Студент:
                            <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <CustomSelect
                            id="studentId"
                            value={selectedStudentOption}
                            onChange={setSelectedStudentOption}
                            options={studentOptions}
                            placeholder="Выберите студента"
                            isDisabled={isLoading || isEditing || studentOptions.length === 0}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="paymentDetails">
                            Детали оплаты:
                        </label>
                        <textarea
                            id="paymentDetails"
                            value={paymentDetails}
                            onChange={(e) => setPaymentDetails(e.target.value)}
                            className={styles.textarea}
                            placeholder="Пример: 1500 рублей 8(800)555-35-35 Альфа-Банк"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.secondaryButton}
                            disabled={isLoading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!isEditing && (!selectedTutorId || !selectedStudentId))}
                            className={styles.primaryButton}
                        >
                            {isLoading
                                ? (isEditing ? 'Сохранение...' : 'Создание...')
                                : (isEditing ? 'Сохранить изменения' : 'Создать связь')
                            }
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};