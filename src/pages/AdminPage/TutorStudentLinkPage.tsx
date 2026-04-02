import React, { useState, useEffect, useCallback } from 'react';
import {
    getTutors,
    getStudents,
    createLink,
    deleteLink,
    CreateLinkPayload,
    getLinks,
    UserBase,
    TutorStudentLink,
    PaginatedLinksResponse,
    updatePaymentDetails
} from '@api/admin-links';
import { CreateLinkModal } from '@components/admin/CreateLinkModal/CreateLinkModal';
import { useAlert } from '@components/ui/alert/AlertContext';
import { Pagination } from '@components/ui/Pagination/Pagination';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif'
// @ts-ignore
import styles from './AdminLinkPage.module.scss';


const DEFAULT_PAGE_SIZE = 10;

export const TutorStudentLinkPage: React.FC = () => {
    const { showAlert, showConfirm } = useAlert();

    const [tutors, setTutors] = useState<UserBase[]>([]);
    const [students, setStudents] = useState<UserBase[]>([]);
    const [links, setLinks] = useState<TutorStudentLink[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<TutorStudentLink | null>(null);

    const formatUserName = (user: UserBase) =>
        `${user.firstName} ${user.lastName || ''} (@${user.username})`;


    const fetchLinks = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedLinksResponse = await getLinks(page, pageSize);
            setLinks(response.links);
            setTotalCount(response.totalCount);
            setCurrentPage(response.page);

        } catch (err) {
            setLinks([]);
            setError('Не удалось загрузить списки пользователей или связи.');
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    const loadUsersForModal = useCallback(async () => {
        setIsModalLoading(true);
        setModalError(null);
        try {
            const [tutorData, studentData] = await Promise.all([
                getTutors(),
                getStudents(),
            ]);
            setTutors(tutorData);
            setStudents(studentData);
            return true;
        } catch (err) {
            setModalError('Не удалось загрузить списки репетиторов и студентов для модального окна.');
            return false; // Возвращаем ошибку
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

    const handleOpenEditModal = (link: TutorStudentLink) => {
        setModalError(null);
        setEditingLink(link);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLink(null);
    };

    const handleOpenModal = async () => {
        setModalError(null);
        setEditingLink(null);
        if (tutors.length === 0 || students.length === 0) {
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
            await createLink(payload);
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

    const handleUpdatePaymentDetails = async (linkId: string, paymentDetails: string): Promise<void> => {
        setIsCreating(true); // Используем isCreating для блокировки модалки
        setModalError(null);
        try {
            await updatePaymentDetails({ linkId, paymentDetails: paymentDetails.trim() });
            showAlert('Детали оплаты успешно обновлены!', 'success');
            handleCloseModal();
            await fetchLinks(currentPage);
        } catch (err: any) {
            const serverMessage = err.response?.data?.errorMessage;
            const message = serverMessage || 'Ошибка при обновлении деталей оплаты.';
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
                    await deleteLink(linkId);
                    showAlert('Связь успешно удалена!', 'success');
                    await fetchLinks(currentPage);
                } catch (err: any) {
                    const serverMessage = (err as any).response?.data?.errorMessage;
                    const message = serverMessage || 'Не удалось удалить занятие.';
                    setError(message);
                    showAlert(message, 'error');
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
                <h1>Управление связями Репетитор-Студент</h1>
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
                        {links?.length === 0 ? (
                            <p>Активных связей нет.</p>
                        ) : (
                            <table>
                                <thead>
                                <tr>
                                    <th>Репетитор</th>
                                    <th>Студент</th>
                                    <th>Детали оплаты</th>
                                    <th>Действия</th>
                                </tr>
                                </thead>
                                <tbody>
                                {links?.map(link => (
                                    <tr key={link.id}>
                                        <td>{formatUserName(link.tutor)}</td>
                                        <td>{formatUserName(link.student)}</td>
                                        <td>
                                    <span title={link.paymentDetails || undefined}>
                                        {link.paymentDetails
                                            ? (link.paymentDetails.length > 50
                                                ? link.paymentDetails.substring(0, 50) + '...'
                                                : link.paymentDetails)
                                            : '—'
                                        }
                                    </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleOpenEditModal(link)}
                                                className={styles.editButton}
                                                disabled={isLoading}
                                            >
                                                Редактировать оплату
                                            </button>
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
                <CreateLinkModal
                    tutors={tutors}
                    students={students}
                    onClose={handleCloseModal}
                    editingLink={editingLink}
                    onCreate={handleCreateLink}
                    onUpdate={handleUpdatePaymentDetails}
                    isLoading={isCreating}
                    error={modalError}
                />
            )}
        </div>
    );
};