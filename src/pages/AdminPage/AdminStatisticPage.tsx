import React, {useState, useEffect, useCallback, JSX} from 'react';
import { getAdminStatistic, AdminStatisticResponse, AdminStatisticItem } from '@api/admin-statistic';
import { StatisticCard } from './StatisticCard';
import { Filter } from '@ui/Input/Filter';
import { StatisticCardModal } from '@components/admin/StatisticCardModal/StatisticCardModal';
// @ts-ignore
import styles from './AdminStatisticPage.module.scss';
// @ts-ignore
import loadingGif from '@images/loading_drop_list.gif';

const getPageSize = () => {
    if (typeof window === 'undefined') return 15;
    return window.innerWidth > 992 ? 15 : 5;
};

const AdminStatisticPage: React.FC = () => {
    const [data, setData] = useState<AdminStatisticResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(getPageSize());
    const [filters, setFilters] = useState<{ isPaid?: boolean, fromDate?: string, toDate?: string }>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<AdminStatisticItem | null>(null);

    useEffect(() => {
        const handleResize = () => setPageSize(getPageSize());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchStatistic = useCallback(async (page: number, size: number, currentFilters: typeof filters) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getAdminStatistic({
                page,
                pageSize: size,
                ...currentFilters
            });
            setData(response);
            setCurrentPage(page);
        } catch (err: any) {
            setError("Не удалось загрузить статистику. Попробуйте обновить страницу.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatistic(currentPage, pageSize, filters);
    }, [currentPage, pageSize, filters, fetchStatistic]);

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleCardClick = (item: AdminStatisticItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleStatusChangeSuccess = (itemId: string, isPaid: boolean) => {
        setData(prevData => {
            if (!prevData) return null;

            return {
                ...prevData,
                items: prevData.items.map(item =>
                    item.id === itemId
                        ? { ...item, isPaid: isPaid }
                        : item
                )
            };
        });
    };


    const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const delta = 1;
        const pages: (JSX.Element | null)[] = [];

        const addPage = (page: number) => {
            pages.push(
                <button
                    key={page}
                    onClick={() => fetchStatistic(page, pageSize, filters)}
                    className={page === currentPage ? styles.activePage : ''}
                    disabled={isLoading}
                >
                    {page}
                </button>
            );
        };

        const addDots = (key: number) => {
            pages.push(<span key={key} className={styles.dots}>...</span>);
        };

        let lastPageAdded = 0;

        addPage(1);
        lastPageAdded = 1;

        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
            if (i > 1 && i < totalPages) {
                if (i > lastPageAdded + 1) {
                    addDots(i * 1000 + 1);
                }
                addPage(i);
                lastPageAdded = i;
            }
        }

        if (lastPageAdded < totalPages - 1) {
            addDots(totalPages * 1000 + 2);
        }

        if (totalPages > 1 && lastPageAdded !== totalPages) {
            addPage(totalPages);
        }

        return (
            <div className={styles.pagination}>
                <button
                    onClick={() => fetchStatistic(currentPage - 1, pageSize, filters)}
                    disabled={currentPage === 1 || isLoading}
                >
                    &laquo; Назад
                </button>

                {pages}

                <button
                    onClick={() => fetchStatistic(currentPage + 1, pageSize, filters)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    Вперед &raquo;
                </button>
            </div>
        );
    };

    if (isLoading && !data) {
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

    const itemsCountMessage = data ?
        `Показано ${data.items.length} из ${data.totalCount} записей. (Всего страниц: ${totalPages})` : '';

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Административная статистика</h1>

            <Filter onFilterChange={handleFilterChange} />

            <p className={styles.countMessage}>{itemsCountMessage}</p>

            <div className={styles.cardGrid}>
                {data?.items.map((item) => (
                    <StatisticCard
                        key={item.id}
                        item={item}
                        onClick={handleCardClick}
                    />
                ))}
            </div>

            {renderPagination()}

            {selectedItem && (
                <StatisticCardModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    item={selectedItem}
                    onStatusChangeSuccess={handleStatusChangeSuccess}
                />
            )}
        </div>
    );
};

export default AdminStatisticPage;