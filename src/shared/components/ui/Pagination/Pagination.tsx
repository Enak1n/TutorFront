import React, {JSX} from 'react';
// @ts-ignore
import styles from './Pagination.module.scss';

export interface PaginationProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    isLoading: boolean;
    onPageChange: (newPage: number) => void;
    delta?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
                                                          totalCount,
                                                          pageSize,
                                                          currentPage,
                                                          isLoading,
                                                          onPageChange,
                                                          delta = 1,
                                                      }) => {
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    if (totalPages <= 1) return null;

    const pages: (JSX.Element | null)[] = [];

    const addPage = (page: number) => {
        pages.push(
            <button
                key={page}
                onClick={() => onPageChange(page)}
                className={page === currentPage ? styles.activePage : ''}
                disabled={isLoading}
            >
                {page}
            </button>
        );
    };

    const addDots = (key: string | number) => {
        pages.push(<span key={key} className={styles.dots}>...</span>);
    };

    let lastPageAdded = 0;

    addPage(1);
    lastPageAdded = 1;

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
        if (i > 1 && i < totalPages) {
            if (i > lastPageAdded + 1) {
                addDots(`dots-before-${i}`);
            }
            addPage(i);
            lastPageAdded = i;
        }
    }

    if (totalPages > 1) {
        if (lastPageAdded < totalPages - 1) {
            addDots(`dots-after-${lastPageAdded}`);
        }

        if (lastPageAdded !== totalPages) {
            addPage(totalPages);
        }
    }

    return (
        <div className={styles.pagination}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                aria-label="Перейти на предыдущую страницу"
            >
                &laquo; Назад
            </button>
            {pages}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                aria-label="Перейти на следующую страницу"
            >
                Вперед &raquo;
            </button>
        </div>
    );
};