import React, { useState, useCallback, useMemo } from 'react';
import { CustomSelect, SelectOption } from '@components/ui/select/CustomSelect';
// @ts-ignore
import styles from './FilterUser.module.scss';


export type UserRole = "tutor" | "student_or_parent" | "admin" | "";

export interface UserFilters {
    Role?: UserRole;
    Username?: string;
    FirstName?: string;
}

interface FilterUserProps {
    onFilterChange: (filters: UserFilters) => void;
    isLoading?: boolean;
}

const RoleOptions: SelectOption[] = [
    { value: "", label: "Все роли" },
    { value: "tutor", label: "Репетитор" },
    { value: "student_or_parent", label: "Ученик/Родитель" },
    { value: "admin", label: "Администратор" },
];

export const FilterUser: React.FC<FilterUserProps> = ({ onFilterChange, isLoading = false }) => {
    const [roleOption, setRoleOption] = useState<SelectOption | null>(RoleOptions[0]);
    const [username, setUsername] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");

    const roleValue = roleOption ? (roleOption.value as UserRole) : "";

    const currentFilters = useMemo(() => {
        const filters: UserFilters = {};
        if (roleValue) filters.Role = roleValue;
        if (username.trim()) filters.Username = username.trim();
        if (firstName.trim()) filters.FirstName = firstName.trim();
        return filters;
    }, [roleValue, username, firstName]);

    const handleApply = useCallback(() => {
        onFilterChange(currentFilters);
    }, [currentFilters, onFilterChange]);

    const handleReset = useCallback(() => {
        setRoleOption(RoleOptions[0]);
        setUsername("");
        setFirstName("");
        onFilterChange({});
    }, [onFilterChange]);


    return (
        <div className={styles.filterContainer}>
            <h2 className={styles.filterTitle}>Фильтры пользователей</h2>
            <div className={styles.filterControls}>

                <div className={styles.selectWrapper}>
                    <CustomSelect
                        id="role-select"
                        value={roleOption}
                        onChange={setRoleOption}
                        options={RoleOptions}
                        placeholder="Фильтр по роли"
                        isDisabled={isLoading}
                    />
                </div>

                <input
                    type="text"
                    placeholder="Username (@...) "
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className={styles.textInput}
                />

                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    className={styles.textInput}
                />

            </div>
            <div className={styles.filterButtons}>
                <button
                    onClick={handleApply}
                    disabled={isLoading}
                    className={styles.applyButton}
                >
                    {isLoading ? 'Поиск...' : 'Применить фильтр'}
                </button>
                <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className={styles.resetButton}
                >
                    Сброс
                </button>
            </div>
        </div>
    );
};