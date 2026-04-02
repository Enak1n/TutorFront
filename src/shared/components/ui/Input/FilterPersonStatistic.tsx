import React, {useCallback, useEffect, useMemo, useState} from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ru } from 'date-fns/locale';
// @ts-ignore
import styles from './FilterPersonStatistic.module.scss';
import { CustomSelect, SelectOption } from '@components/ui/select/CustomSelect';
// @ts-ignore
import { LESSON_TYPE_LABELS } from '@appTypes/LessonConfig';

registerLocale('ru', ru);

export interface PersonStatisticFilters {
    lessonType?: string;
    fromDate?: string;
    toDate?: string;
    tutorName?: string;
}

interface FilterProps {
    onFilterChange: (filters: PersonStatisticFilters) => void;
    isLoading?: boolean;
    userRole: "tutor" | "student_or_parent";
    initialFilters: PersonStatisticFilters;
}

const dateToString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const stringToDate = (str: string): Date | undefined => {
    if (!str) return undefined;
    const parts = str.split('-').map(p => parseInt(p, 10));
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return isNaN(date.getTime()) ? undefined : date;
};

const lessonTypeOptions: SelectOption[] = Object.entries(LESSON_TYPE_LABELS).map(([, label]) => ({
    value: label,
    label: label
}));

const findOptionByValue = (value?: string | null): SelectOption | null => {
    if (!value) return null;
    return lessonTypeOptions.find(opt => opt.value === value) || null;
};

export const FilterPersonStatistic: React.FC<FilterProps> = ({ onFilterChange, isLoading = false, userRole, initialFilters }) => {
    const [startDateString, setStartDateString] = useState<string>('');
    const [endDateString, setEndDateString] = useState<string>('');
    const [selectedLessonType, setSelectedLessonType] = useState<SelectOption | null>(null);
    const [tutorName, setTutorName] = useState<string>('');

    const selectedStartDate = stringToDate(startDateString);
    const selectedEndDate = stringToDate(endDateString);

    const handleStartDateChange = (date: Date | null) => {
        const newDateString = dateToString(date);
        if (selectedEndDate && date && date.getTime() > selectedEndDate.getTime()) {
            setEndDateString('');
        }
        setStartDateString(newDateString);
    };

    useEffect(() => {
        setStartDateString(initialFilters.fromDate || '');
        setEndDateString(initialFilters.toDate || '');
        setSelectedLessonType(findOptionByValue(initialFilters.lessonType));
        setTutorName(initialFilters.tutorName || '');
    }, [initialFilters]);

    const handleEndDateChange = (date: Date | null) => {
        const newDateString = dateToString(date);
        if (selectedStartDate && date && date.getTime() < selectedStartDate.getTime()) {
            return;
        }
        setEndDateString(newDateString);
    };

    const handleLessonTypeChange = (option: SelectOption | null) => {
        setSelectedLessonType(option);
    };

    const generateFilters = useMemo((): PersonStatisticFilters => {
        const filters: PersonStatisticFilters = {};

        if (selectedLessonType) {
            filters.lessonType = selectedLessonType.value;
        }
        if (startDateString) {
            filters.fromDate = startDateString;
        }
        if (endDateString) {
            filters.toDate = endDateString;
        }
        if (tutorName.trim() && userRole !== 'tutor') {
            filters.tutorName = tutorName.trim();
        }
        return filters;
    }, [startDateString, endDateString, selectedLessonType, tutorName, userRole]);

    const handleApply = useCallback(() => {
        onFilterChange(generateFilters);
    }, [generateFilters, onFilterChange]);

    const handleReset = useCallback(() => {
        setStartDateString('');
        setEndDateString('');
        setSelectedLessonType(null);
        setTutorName('');
        onFilterChange({});
    }, [onFilterChange]);

    const showTutorNameFilter = userRole === 'student_or_parent';
    const tutorNameLabel = "Репетитор:";

    return (
        <div className={styles.filterContainer}>
            <h2 className={styles.filterTitle}>Фильтр</h2>

            <div className={styles.filterControls}>

                <div className={styles.filterGroup}>

                    <div className={styles.dateControlWrapper}>
                        <label className={styles.dateLabel}>Предмет:</label>
                        <CustomSelect
                            id="lessonTypeFilter"
                            value={selectedLessonType}
                            onChange={handleLessonTypeChange}
                            // options={lessonTypeOptions}
                            options={lessonTypeOptions}
                            placeholder="Выберите предмет"
                            isDisabled={isLoading}
                        />
                    </div>

                    {showTutorNameFilter && (
                        <div className={styles.dateControlWrapper}>
                            <label className={styles.dateLabel}>{tutorNameLabel}</label>
                            <input
                                type="text"
                                value={tutorName}
                                onChange={(e) => setTutorName(e.target.value)}
                                placeholder="Имя или фамилия"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.filterGroup}>

                    <div className={styles.dateControlWrapper}>
                        <label className={styles.dateLabel}>Начальная дата:</label>
                        <DatePicker
                            selected={selectedStartDate}
                            onChange={handleStartDateChange}
                            selectsStart
                            startDate={selectedStartDate}
                            endDate={selectedEndDate}
                            maxDate={selectedEndDate}
                            disabled={isLoading}
                            className={styles.dateInput}
                            dateFormat="dd.MM.yyyy"
                            isClearable
                            locale="ru"
                        />
                    </div>

                    <div className={styles.dateControlWrapper}>
                        <label className={styles.dateLabel}>Конечная дата:</label>
                        <DatePicker
                            selected={selectedEndDate}
                            onChange={handleEndDateChange}
                            selectsEnd
                            startDate={selectedStartDate}
                            endDate={selectedEndDate}
                            minDate={selectedStartDate}
                            disabled={isLoading}
                            className={styles.dateInput}
                            dateFormat="dd.MM.yyyy"
                            isClearable
                            locale="ru"
                        />
                    </div>

                    <div className={styles.checkboxControlWrapper}>
                        <div className={styles.checkboxLabelPlaceholder}>Placeholder</div>
                        <div className={styles.checkboxGroup}>
                        </div>
                    </div>

                </div>

            </div>

            <div className={styles.filterButtons}>
                <button
                    onClick={handleApply}
                    disabled={isLoading}
                    className={styles.applyButton}
                >
                    {isLoading ? 'Применение...' : 'Применить'}
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