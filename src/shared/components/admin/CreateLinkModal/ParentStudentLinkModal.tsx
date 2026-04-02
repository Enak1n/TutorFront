import React, { useState, useMemo } from 'react';
import { UserBase, CreateLinkPayload } from '@api/admin-links';
import { CustomSelect, SelectOption } from '@components/ui/select/CustomSelect';
// @ts-ignore
import styles from './ParentStudentLinkModal.module.scss';


interface ParentStudentLinkModalProps {
    users: UserBase[];
    onClose: () => void;
    onCreate: (payload: CreateLinkPayload) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const ParentStudentLinkModal: React.FC<ParentStudentLinkModalProps> = ({
                                                                                  users,
                                                                                  onClose,
                                                                                  onCreate,
                                                                                  isLoading,
                                                                                  error,
                                                                              }) => {
    const [selectedParentOption, setSelectedParentOption] = useState<SelectOption | null>(null);
    const [selectedStudentOption, setSelectedStudentOption] = useState<SelectOption | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const formatUserName = (user: UserBase) =>
        `${user.firstName} ${user.lastName || ''} (@${user.username})`;

    const userOptions: SelectOption[] = useMemo(() => users.map(u => ({
        value: u.id,
        label: formatUserName(u)
    })), [users]);

    const selectedParentId = selectedParentOption?.value;
    const selectedStudentId = selectedStudentOption?.value;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!selectedParentId || !selectedStudentId) {
            setLocalError('Пожалуйста, выберите родителя и студента.');
            return;
        }

        if (selectedParentId === selectedStudentId) {
            setLocalError('Родитель и Студент не могут быть одним и тем же пользователем.');
            return;
        }

        try {
            await onCreate({
                tutorId: selectedParentId,
                studentId: selectedStudentId,
                paymentDetails: "",
            });
        } catch (e) {
            console.error('Ошибка в handleSubmit модалки:', e);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть модальное окно">
                    &times;
                </button>

                <h2 className={styles.modalTitle}>Создание связи Родитель-Студент</h2>

                {(error || localError) && <p className={styles.errorText}>{error || localError}</p>}

                <form onSubmit={handleSubmit}>

                    <div className={styles.formGroup}>
                        <label htmlFor="parentId">
                            Родитель (или ответственное лицо):
                            <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <CustomSelect
                            id="parentId"
                            value={selectedParentOption}
                            onChange={setSelectedParentOption}
                            options={userOptions}
                            placeholder="Выберите родителя"
                            isDisabled={isLoading || userOptions.length === 0}
                            required
                        />
                        {userOptions.length === 0 && (
                            <p className={styles.warningText}>Нет доступных пользователей 'Студент/Родитель'.</p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="studentId">
                            Студент (ученик):
                            <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <CustomSelect
                            id="studentId"
                            value={selectedStudentOption}
                            onChange={setSelectedStudentOption}
                            options={userOptions}
                            placeholder="Выберите студента"
                            isDisabled={isLoading || userOptions.length === 0}
                            required
                        />
                        {userOptions.length === 0 && (
                            <p className={styles.warningText}>Нет доступных пользователей 'Студент/Родитель'.</p>
                        )}
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
                            disabled={isLoading || !selectedParentId || !selectedStudentId || selectedParentId === selectedStudentId}
                            className={styles.primaryButton}
                        >
                            {isLoading ? 'Создание...' : 'Создать связь'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};