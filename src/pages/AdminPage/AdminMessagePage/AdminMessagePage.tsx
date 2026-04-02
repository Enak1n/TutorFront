import React, {useState, useEffect, useCallback, useRef} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAllChatsForAdmin, AdminChatPreview } from '@api/admin-message';
import { searchUsersForChatFilter, Interlocutor } from '@api/search';
import AdminChatComponent from './AdminChatComponent';
import { Pagination } from '@components/ui/Pagination/Pagination';
// @ts-ignore
import styles from './AdminMessagePage.module.scss';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif';
import ChatSearchInput from '@components/ui/Input/ChatSearchInput';

const PAGE_SIZE = 10;
const SEARCH_MIN_LENGTH = 3;
const DEBOUNCE_DELAY = 300;

const AdminMessagePage: React.FC = () => {
    const { chatId: urlChatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    const [chats, setChats] = useState<AdminChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [activeChat, setActiveChat] = useState<AdminChatPreview | undefined>(undefined);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Interlocutor[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [selectedUserForSearch, setSelectedUserForSearch] = useState<Interlocutor | null>(null);
    const [selectedUserForFilter, setSelectedUserForFilter] = useState<Interlocutor | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    const loadChats = useCallback(async (page: number, selectedUserId: string | undefined = undefined) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllChatsForAdmin({
                page: page,
                pageSize: PAGE_SIZE,
                userId: selectedUserId
            });

            setChats(data.items);
            setTotalCount(data.totalCount);
            setCurrentPage(data.page);

            if (urlChatId) {
                const foundChat = data.items.find(c => c.chatId === urlChatId);
                setActiveChat(foundChat);
            } else {
                setActiveChat(undefined);
            }

        } catch (err: any) {
            setError('Не удалось загрузить список чатов. ' + (err.message || 'Произошла ошибка.'));
        } finally {
            setIsLoading(false);
        }
    }, [urlChatId]);

    const executeSearch = useCallback(async (query: string) => {
        if (query.length < SEARCH_MIN_LENGTH) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        setIsSearchLoading(true);
        setSearchError(null);
        try {
            const data = await searchUsersForChatFilter(query);
            setSearchResults(data.interlocutors);
        } catch (err) {
            setSearchError('Ошибка при поиске пользователей.');
            setSearchResults([]);
        } finally {
            setIsSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm && !selectedUserForSearch) {
                executeSearch(searchTerm);
            }
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, executeSearch, selectedUserForSearch]);

    useEffect(() => {
        const userId = selectedUserForFilter ? selectedUserForFilter.id : undefined;
        loadChats(currentPage, userId);
    }, [currentPage, loadChats, selectedUserForFilter]);

    useEffect(() => {
        if (!isSearchLoading && searchTerm && !selectedUserForSearch && inputRef.current) {
            if (document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        }
    }, [isSearchLoading, searchTerm, selectedUserForSearch]);

    const handleSelectUser = (user: Interlocutor) => {
        setSelectedUserForSearch(user);
        setSearchTerm(user.fullName);
        setSearchResults([]);

        setSelectedUserForFilter(user);
        setCurrentPage(1);
    };

    const handleApplyFilter = () => {
        if (searchTerm === '') {
            setSelectedUserForFilter(null);
            setSelectedUserForSearch(null);
            setSearchResults([]);
            setCurrentPage(1);
        }
        else if (selectedUserForSearch) {
            setSelectedUserForFilter(selectedUserForSearch);
            setCurrentPage(1);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (selectedUserForSearch) {
            setSelectedUserForSearch(null);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (canApplyFilter) {
                handleApplyFilter();
            }
            e.preventDefault();
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalCount / PAGE_SIZE)) {
            setCurrentPage(newPage);
        }
    };

    const handleChatClick = useCallback((chat: AdminChatPreview) => {
        setActiveChat(chat);
        navigate(`/all-message/${chat.chatId}`);
    }, [navigate]);

    const handleChatClose = useCallback(() => {
        setActiveChat(undefined);
        navigate('/all-message');
    }, [navigate]);

    const roleDisplayMap: Record<string, string> = {
        'student_or_parent': 'Ученик/Родитель',
        'admin': 'Администратор',
        'tutor': 'Репетитор',
    };

    const getRoleDisplayName = (roleId: string): string => {
        return roleDisplayMap[roleId] || roleId;
    };

    const filterIsApplied = selectedUserForFilter !== null;
    const currentStatus = filterIsApplied ? ` (Фильтр: ${selectedUserForFilter?.fullName})` : '';
    const canApplyFilter = (searchTerm === '' && filterIsApplied);

    if (isLoading && !activeChat) {
        return (
            <div className={styles.loadingContainer}>
                <img src={loading_list} alt="Загрузка чатов" style={{ width: '80px', height: '80px' }} />
                <div>Загрузка всех чатов...</div>
            </div>
        );
    }

    if (error && !activeChat) {
        return <div className={styles.error}>{error}</div>;
    }

    if (activeChat) {
        return (
            <AdminChatComponent
                chatId={activeChat.chatId}
                firstUser={activeChat.firstUser}
                secondUser={activeChat.secondUser}
                onClose={handleChatClose}
            />
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>Все Диалоги {currentStatus}</h2>

            <div className={styles.searchBlock}>
                <ChatSearchInput
                    ref={inputRef}
                    placeholder="Введите имя или username"
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSearchLoading}
                    className={styles.searchInput}
                />

                <button
                    onClick={handleApplyFilter}
                    className={styles.applyFilterButton}
                    disabled={isSearchLoading || (!searchTerm && !filterIsApplied)}
                >
                    Поиск
                </button>

                {searchResults.length > 0 && (
                    <div className={styles.searchResultsDropdown}>
                        {searchResults.map(user => (
                            <div
                                key={user.id}
                                className={styles.searchResultItem}
                                onClick={() => handleSelectUser(user)}
                            >
                                <span>{user.fullName}</span>
                                <span className={styles.username}>@{user.username}</span>
                            </div>
                        ))}
                    </div>
                )}

                {isSearchLoading && (
                    <div className={styles.searchStatus}>
                        <img src={loading_list} alt="Поиск..." style={{ width: '20px', height: '20px' }} />
                        Поиск...
                    </div>
                )}

                {searchError && <div className={styles.searchError}>{searchError}</div>}
                {searchTerm.length >= SEARCH_MIN_LENGTH && !isSearchLoading && searchResults.length === 0 && !searchError && !filterIsApplied && !selectedUserForSearch && (
                    <div className={styles.searchStatus}>Пользователи не найдены.</div>
                )}
            </div>

            {totalCount > 0 && (
                <p className={styles.totalCountInfo}>
                    Показано {chats.length} записей из {totalCount}
                </p>
            )}

            <div className={styles.dialogueList}>
                {chats.length === 0 ? (
                    <p className={styles.emptyList}>Активных диалогов не найдено.</p>
                ) : (
                    chats.map(chat => {
                        const user1 = chat.firstUser;
                        const user2 = chat.secondUser;

                        const formatId = (id: string): string => {
                            if (id.length <= 13) return id;

                            const start = id.substring(0, 8);
                            const end = id.slice(-5);

                            return `${start}...${end}`;
                        };

                        return (
                            <div
                                key={chat.chatId}
                                className={styles.dialogueItem}
                                onClick={() => handleChatClick(chat)}
                            >
                                <div className={styles.usersInfo}>
                                    <div className={styles.userInfo}>
                                        <img src={user1.photoUrl || '/default-avatar.png'} alt={user1.firstName} className={styles.avatar} />
                                        <div className={styles.nameRole}>
                                            <span className={styles.name}>{user1.firstName} {user1.lastName}</span>
                                            <span className={styles.role}>({getRoleDisplayName(user1.role.id)})</span>
                                            <span className={styles.additionalInfo}>ID: {formatId(user1.id)}</span>
                                            {user1.username && <span className={styles.additionalInfo}>@{user1.username}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.userInfo}>
                                        <img src={user2.photoUrl || '/default-avatar.png'} alt={user2.firstName} className={styles.avatar} />
                                        <div className={styles.nameRole}>
                                            <span className={styles.name}>{user2.firstName} {user2.lastName}</span>
                                            <span className={styles.role}>({getRoleDisplayName(user2.role.id)})</span>
                                            <span className={styles.additionalInfo}>ID: {formatId(user2.id)}</span>
                                            {user2.username && <span className={styles.additionalInfo}>@{user2.username}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className={styles.paginationWrapper}>
                <Pagination
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    currentPage={currentPage}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default AdminMessagePage;