import React, { useState, useEffect, useCallback } from 'react';
import {
    getStudents,
    createParentStudentLink,
    deleteParentStudentLink,
    getParentStudentLinks,
    CreateLinkPayload,
    UserBase,
    ParentStudentLink,
    PaginatedParentLinksResponse
} from '@api/admin-links';
import { ParentStudentLinkModal } from '@components/admin/CreateLinkModal/ParentStudentLinkModal';
import { useAlert } from '@components/ui/alert/AlertContext';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif'
// @ts-ignore
import styles from './AdminLinkPage.module.scss';
import { Pagination } from '@components/ui/Pagination/Pagination';

const DEFAULT_PAGE_SIZE = 10;

export const ParentStudentLinkPage: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();
    const [users, setUsers] = useState<UserBase[]>([]);
    const [links, setLinks] = useState<ParentStudentLink[]>([]);


    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formatUserName = (user: UserBase) =>
        `${user.firstName} ${user.lastName || ''} (@${user.username})`;


    const fetchLinks = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedParentLinksResponse = await getParentStudentLinks(page, pageSize);

            setLinks(response.links);
            setTotalCount(response.totalCount);
            setCurrentPage(response.page);

        } catch (err) {
            setLinks([]);
            setError('Не удалось загрузить связи Родитель-Студент.');
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    const loadUsersForModal = useCallback(async () => {
        setIsModalLoading(true);
        setModalError(null);
        try {
            const userData = await getStudents();
            setUsers(userData);
            return true;
        } catch (err) {
            setModalError('Не удалось загрузить списки пользователей (Родители/Студенты) для модального окна.');
            return false;
        } finally {
            setIsModalLoading(false);
        }
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage !== currentPage) {
            setCurrentPage(newPage);
            fetchLinks(newPage);
        }
    };

    useEffect(() => {
        fetchLinks(currentPage);
    }, [fetchLinks, currentPage]);

    const handleOpenModal = async () => {
        setModalError(null);
        if (users.length === 0) {
            const success = await loadUsersForModal();
            if (!success) {
                return;
            }
        }
        setIsModalOpen(true);
    };

    const handleCreateLink = async (payload: CreateLinkPayload): Promise<void> => {
        setIsCreating(true);
        setModalError(null);
        try {
            await createParentStudentLink(payload);
            showAlert('Связь успешно создана!', 'success');
            setIsModalOpen(false);
            setCurrentPage(1);
            await fetchLinks(1);
        } catch (err: any) {
            const serverMessage = err.response?.data?.errorMessage;
            const message = serverMessage || 'Ошибка при создании связи. Возможно, она уже существует.';
            setModalError(message);
            throw new Error(message);
        } finally {
            setIsCreating(false);
        }
    };


    const handleDeleteLink = async (linkId: string) => {
        showConfirm(
            'Вы уверены, что хотите удалить эту связь? Это действие необратимо.',
            async () => {
                try {
                    setIsLoading(true);
                    await deleteParentStudentLink(linkId);
                    showAlert('Связь успешно удалена!', 'success');
                    const newTotalCount = totalCount - 1;
                    const totalPagesAfterDeletion = newTotalCount > 0 ? Math.ceil(newTotalCount / pageSize) : 1;
                    let pageToFetch = currentPage;
                    if (currentPage > totalPagesAfterDeletion) {
                        pageToFetch = totalPagesAfterDeletion;
                        setCurrentPage(pageToFetch);
                    }
                    await fetchLinks(pageToFetch);
                } catch (err: any) {
                    const serverMessage = err.response?.data?.errorMessage;
                    const errorMessage = serverMessage || 'Ошибка при удалении связи.';
                    showAlert(errorMessage, 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    if (isLoading) {
        return (
            <div
                className={styles.loading}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <img
                    src={loading_list}
                    alt="Загрузка списка..."
                    style={{
                        width: '80px',
                        height: '80px',
                        marginBottom: '10px'
                    }}
                />
                <div>Загрузка данных...</div>
            </div>
        );
    }
    if (error) return <div className={styles.error}>Ошибка: {error}</div>;


    return (
        <div className={styles.adminLinkPage}>
            <div className={styles.header}>
                <h1>Управление связями Родитель-Студент</h1>
                <button
                    onClick={handleOpenModal}
                    className={styles.createButton}
                    disabled={isLoading || isModalLoading}
                >
                    {isModalLoading ? 'Загрузка...' : 'Создать новую связь'}
                </button>
            </div>

            {(isLoading && !isCreating) ? (
                <div className={styles.loading}>Загрузка данных...</div>
            ) : (
                <>
                    {error && <div className={styles.error}>{error}</div>}
                    {totalCount > 0 && (
                        <p className={styles.totalCountInfo}>
                            Показано {links.length} записей из {totalCount}
                        </p>
                    )}

                    <div className={styles.linkTable}>
                        {links.length === 0 ? (
                            <p>Активных связей нет.</p>
                        ) : (
                            <table>
                                <thead>
                                <tr>
                                    <th>Родитель (или ответственное лицо)</th>
                                    <th>Студент (ученик)</th>
                                    <th>Действия</th>
                                </tr>
                                </thead>
                                <tbody>
                                {links.map(link => (
                                    <tr key={link.id}>
                                        <td>{formatUserName(link.parent)}</td>
                                        <td>{formatUserName(link.student)}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                className={styles.deleteButton}
                                                disabled={isLoading}
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <Pagination
                            totalCount={totalCount}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            isLoading={isLoading}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}

            {isModalOpen && (
                <ParentStudentLinkModal
                    users={users}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateLink}
                    isLoading={isCreating}
                    error={modalError}
                />
            )}
        </div>
    );
};