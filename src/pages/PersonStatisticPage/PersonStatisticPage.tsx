import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import styles from './PersonStatisticPage.module.scss';
import { Pagination } from '@components/ui/Pagination/Pagination';
import { LessonCardStatistic } from './LessonCardStatistic';
import { getLessonStats, LessonStat, GetLessonStatsParams } from '@api/person-statistic';
import { FilterPersonStatistic, PersonStatisticFilters } from '@components/ui/Input/FilterPersonStatistic';
// @ts-ignore
import loadingGif from '@images/loading_drop_list.gif';

interface PersonStatisticPageProps {
    userRole: "tutor" | "student_or_parent";
}

const defaultFilters: PersonStatisticFilters = {};

export const PersonStatisticPage: React.FC<PersonStatisticPageProps> = ({ userRole }) => {
    const [stats, setStats] = useState<LessonStat[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pageSize = 9;
    const [filters, setFilters] = useState<PersonStatisticFilters>(defaultFilters);

    const loadStats = useCallback(async (page: number, currentFilters: PersonStatisticFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const params: GetLessonStatsParams = {
                page,
                pageSize,
                LessonType: currentFilters.lessonType,
                FromDate: currentFilters.fromDate,
                ToDate: currentFilters.toDate,
                TutorName: currentFilters.tutorName,
            };

            const data = await getLessonStats(params);

            setStats(data.lessonStats);
            setTotalCount(data.totalCount);
            setCurrentPage(data.page);
        } catch (err) {
            const errorMessage = (err as any).response?.data?.errorMessage || (err as Error).message || "Не удалось загрузить статистику занятий. Проверьте подключение.";
            setError(errorMessage);
            setStats([]);
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        loadStats(currentPage, filters);
    }, [currentPage, loadStats, filters]);

    const handlePageChange = (newPage: number) => {
        const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleFilterChange = (newFilters: PersonStatisticFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    if (isLoading && stats.length === 0 && currentPage === 1) {
        return (
            <div className={styles.loadingContainer}>
                <img src={loadingGif} alt="Загрузка..." />
                <div>Загрузка статистики...</div>
            </div>
        );
    }

    if (error) {
        return <div className={styles.errorContainer}>Ошибка: {error}</div>;
    }

    const isTutor = userRole === "tutor";
    const pageTitle = isTutor ? "Статистика Ваших Занятий" : "Статистика Ваших Уроков";
    const itemsCountMessage = totalCount > 0
        ? `Показано ${stats.length} из ${totalCount} занятий.`
        : '';

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>{pageTitle}</h1>

            <div className={styles.filterWrapper}>
                <FilterPersonStatistic
                    onFilterChange={handleFilterChange}
                    isLoading={isLoading}
                    userRole={userRole}
                    initialFilters={filters}
                />
            </div>

            {isLoading && <div className={styles.loadingContainer}>Обновление данных...</div>}

            {!isLoading && totalCount > 0 && !error && (
                <p className={styles.countMessage}>{itemsCountMessage}</p>
            )}

            {!isLoading && stats.length === 0 && !error && totalCount === 0 && (
                <p className={styles.emptyState}>Занятия не найдены.</p>
            )}

            <div className={styles.cardGrid}>
                {stats.map((lesson, index) => (
                    <LessonCardStatistic
                        key={index}
                        lesson={lesson}
                        userRole={userRole}
                    />
                ))}
            </div>

            <div className={styles.paginationWrapper}>
                <Pagination
                    totalCount={totalCount}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                    delta={2}
                />
            </div>

        </div>
    );
};