import React, { useState, useEffect } from 'react';
import { UserDetailedInfo } from '@api/auth';
import { UserUpdateData } from '@api/profile';
import { CustomSelect, SelectOption } from '@components/ui/select/CustomSelect';
// @ts-ignore
import styles from './EditUserModal.module.scss';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: UserDetailedInfo;
    onSave: (data: UserUpdateData) => Promise<void>;
    targetUserId: string;
}

const roleOptions: SelectOption[] = [
    { value: 'tutor', label: 'Репетитор' },
    { value: 'student_or_parent', label: 'Ученик / Родитель' },
    { value: 'admin', label: 'Администратор' },
];

const getOptionByValue = (value: string): SelectOption | null => {
    return roleOptions.find(opt => opt.value === value) || null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
    const [firstName, setFirstName] = useState(initialData.firstName);
    const [lastName, setLastName] = useState(initialData.lastName || '');
    const [selectedRoleOption, setSelectedRoleOption] = useState<SelectOption | null>(
        getOptionByValue(initialData.role.id)
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFirstName(initialData.firstName);
            setLastName(initialData.lastName || '');
            setSelectedRoleOption(getOptionByValue(initialData.role.id));
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoleOption) return;
        setIsSaving(true);

        const updateData: UserUpdateData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            roleId: selectedRoleOption.value as UserUpdateData['roleId'],
        };

        await onSave(updateData);
        setIsSaving(false);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>Редактирование профиля</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Имя:</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Фамилия:</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Роль:</label>
                        <CustomSelect
                            id="user-role-select"
                            value={selectedRoleOption}
                            onChange={setSelectedRoleOption}
                            options={roleOptions}
                            placeholder="Выберите роль"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.saveButton} disabled={isSaving}>
                        {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>

                    <p className={styles.warning}>
                        Внимание: Изменение роли может повлиять на права доступа пользователя.
                    </p>
                </form>
            </div>
        </div>
    );
};