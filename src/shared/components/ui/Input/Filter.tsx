import React, { useCallback, useMemo, useState } from 'react';
import DatePicker, {registerLocale} from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale';
// @ts-ignore
import styles from './Filter.module.scss';

registerLocale('ru', ru);

export interface StatisticFilters {
    isPaid?: boolean;
    fromDate?: string;
    toDate?: string;
}

interface FilterProps {
    onFilterChange: (filters: StatisticFilters) => void;
    isLoading?: boolean;
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

export const Filter: React.FC<FilterProps> = ({ onFilterChange, isLoading = false }) => {
    const [paymentStatus, setPaymentStatus] = useState<boolean | null>(null);
    const [startDateString, setStartDateString] = useState<string>('');
    const [endDateString, setEndDateString] = useState<string>('');

    const selectedStartDate = stringToDate(startDateString);
    const selectedEndDate = stringToDate(endDateString);

    const handleStartDateChange = (date: Date | null) => {
        const newDateString = dateToString(date);
        if (selectedEndDate && date && date.getTime() > selectedEndDate.getTime()) {
            setEndDateString('');
        }
        setStartDateString(newDateString);
    };

    const handleEndDateChange = (date: Date | null) => {
        const newDateString = dateToString(date);
        if (selectedStartDate && date && date.getTime() < selectedStartDate.getTime()) {
            return;
        }
        setEndDateString(newDateString);
    };

    const generateFilters = useMemo((): StatisticFilters => {
        const filters: StatisticFilters = {};
        if (paymentStatus !== null) {
            filters.isPaid = paymentStatus;
        }
        if (startDateString) {
            filters.fromDate = startDateString;
        }
        if (endDateString) {
            filters.toDate = endDateString;
        }
        return filters;
    }, [paymentStatus, startDateString, endDateString]);

    const handleApply = useCallback(() => {
        onFilterChange(generateFilters);
    }, [generateFilters, onFilterChange]);

    const handleReset = useCallback(() => {
        setPaymentStatus(null);
        setStartDateString('');
        setEndDateString('');
        onFilterChange({});
    }, [onFilterChange]);

    return (
        <div className={styles.filterContainer}>
            <h2 className={styles.filterTitle}>Фильтр</h2>
            <div className={styles.filterControls}>
                <div className={styles.checkboxControlWrapper}>
                    <div className={styles.checkboxLabelPlaceholder}>Статус оплаты:</div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.filterLabel}>
                            <input
                                type="radio"
                                name="paymentStatus"
                                checked={paymentStatus === true}
                                onChange={() => setPaymentStatus(true)}
                                disabled={isLoading}
                            /> Оплачено
                        </label>
                        <label className={styles.filterLabel}>
                            <input
                                type="radio"
                                name="paymentStatus"
                                checked={paymentStatus === false}
                                onChange={() => setPaymentStatus(false)}
                                disabled={isLoading}
                            /> Не оплачено
                        </label>
                    </div>
                </div>

                {/* --- ПОЛЯ ДАТЫ --- */}
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