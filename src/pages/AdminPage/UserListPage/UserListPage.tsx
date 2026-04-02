import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, AllUsersResponse } from '@api/user-list';
import { FilterUser, UserFilters } from '@components/ui/Input/FilterUser';
import { Pagination } from '@components/ui/Pagination/Pagination';
import { UserCard } from './UserCard';
import { useAlert } from '@components/ui/alert/AlertContext';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif';
// @ts-ignore
import styles from './UserListPage.module.scss';

const PAGE_SIZE = 12;

export const UserListPage: React.FC = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [usersData, setUsersData] = useState<AllUsersResponse | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<UserFilters>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async (page: number, currentFilters: UserFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllUsers(page, PAGE_SIZE, currentFilters);
            setUsersData(data);
            setCurrentPage(page);
        } catch (err: any) {
            console.error('Ошибка загрузки пользователей:', err);
            const serverMessage = err.response?.data?.errorMessage;
            setError(serverMessage || 'Не удалось загрузить список пользователей. Повторите попытку.');
            showAlert(serverMessage || 'Ошибка загрузки данных', 'error');
            setUsersData(null);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);


    useEffect(() => {
        fetchUsers(currentPage, filters);
    }, [fetchUsers]);

    const performScroll = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handlePageChange = useCallback((newPage: number) => {
        fetchUsers(newPage, filters);
        performScroll();

    }, [fetchUsers, filters]);

    const handleFilterChange = useCallback((newFilters: UserFilters) => {
        setFilters(newFilters);
        fetchUsers(1, newFilters);
        performScroll();

    }, [fetchUsers]);

    const handleUserCardClick = useCallback((userId: string) => {
        navigate(`/user/profile/${userId}`);
    }, [navigate]);


    const totalCount = usersData?.totalCount || 0;

    const countMessage = usersData && !error && !isLoading
        ? `Найдено записей: ${usersData.totalCount}`
        : null;

    return (
        <div className={styles.userListPage}>
            <h1 className={styles.title}>Пользователи</h1>

            <FilterUser
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
            />

            {countMessage && <p className={styles.countMessage}>{countMessage}</p>}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.userListContainer}>
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <img src={loading_list} alt="Загрузка..." />
                        <div>Загрузка пользователей...</div>
                    </div>
                )}

                {usersData?.users.length === 0 && !isLoading ? (
                    <p className={styles.noResults}>
                        По вашему запросу пользователи не найдены.
                    </p>
                ) : (
                    <div className={styles.userCardGrid}>
                        {usersData?.users.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onClick={handleUserCardClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {usersData && (
                <Pagination
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};