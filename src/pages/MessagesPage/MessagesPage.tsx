import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMyChats, getSupportChat, type ChatPreview } from '@api/chat';
import { useChat } from '../../shared/chat/useChat';
import { useAuth } from '../../shared/auth/AuthContext';
import { useSSE, isUserOnline } from '../../shared/sse/SSEComponent/SSEContext';
import { Avatar } from '@components/ui/Avatar/Avatar';
import { ChatBubbleIcon, SearchIcon } from '@components/ui/icons';
import ChatComponent from './ChatComponent';
// @ts-ignore
import styles from './MessagesPage.module.scss';

const ROLE_LABELS: Record<string, string> = {
    student_or_parent: 'Ученик / родитель',
    admin: 'Администратор',
    tutor: 'Репетитор',
};

/** Сегодня — время, вчера — «вчера», на этой неделе — день недели, иначе дата. */
const formatChatTime = (iso: string | null): string => {
    if (!iso) return '';

    const date = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (date.getTime() >= startOfToday) {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    if (date.getTime() >= startOfToday - dayMs) return 'вчера';
    if (date.getTime() >= startOfToday - 6 * dayMs) {
        return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    });
};

const fullName = (chat: ChatPreview) =>
    `${chat.companion.firstName ?? ''} ${chat.companion.lastName ?? ''}`.trim() || 'Без имени';

const MessagesPage: React.FC = () => {
    const { chatId: activeChatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { userId } = useAuth();
    const { stopChatConnection, state: chatState } = useChat();
    const { resetNotificationCount, sseData } = useSSE();

    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        resetNotificationCount();
    }, [resetNotificationCount]);

    /** Загрузка списка. Повторные обновления идут «тихо», без экрана загрузки. */
    const loadChats = useCallback(async () => {
        try {
            const data = await fetchMyChats();
            setChats(data);
            setError(null);
        } catch (err: any) {
            if (!hasLoadedRef.current) {
                setError('Не удалось загрузить список чатов. ' + (err?.message || 'Произошла ошибка.'));
            }
        } finally {
            hasLoadedRef.current = true;
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadChats();
    }, [loadChats, activeChatId]);

    // Новое уведомление о сообщении или новое сообщение в открытом чате — обновляем превью и счётчики.
    const messageCount = chatState.currentChatMessages.length;
    useEffect(() => {
        if (!hasLoadedRef.current) return;
        const timer = setTimeout(loadChats, 400);
        return () => clearTimeout(timer);
    }, [sseData.globalNotificationCount, messageCount, loadChats]);

    const activeChat = useMemo(
        () => chats.find(chat => chat.chatId === activeChatId),
        [chats, activeChatId],
    );

    const visibleChats = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return chats;
        return chats.filter(chat => fullName(chat).toLowerCase().includes(normalized));
    }, [chats, query]);

    const openChat = useCallback((chatId: string) => navigate(`/messages/${chatId}`), [navigate]);
    const closeChat = useCallback(() => navigate('/messages'), [navigate]);

    const [isOpeningSupport, setIsOpeningSupport] = useState(false);
    const openSupport = useCallback(async () => {
        setIsOpeningSupport(true);
        try {
            const { chatId } = await getSupportChat();
            await loadChats();
            navigate(`/messages/${chatId}`);
        } catch (err: any) {
            setError(err?.response?.data?.errorMessage || 'Не удалось открыть чат поддержки');
        } finally {
            setIsOpeningSupport(false);
        }
    }, [loadChats, navigate]);

    const hasActiveChat = Boolean(activeChatId);

    const renderList = () => {
        if (isLoading) {
            return (
                <div className={styles.listState}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className={styles.skeletonItem}>
                            <span className={styles.skeletonAvatar} />
                            <span className={styles.skeletonLines}>
                                <span />
                                <span />
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (error) return <p className={styles.listMessage}>{error}</p>;

        if (chats.length === 0) {
            return (
                <div className={styles.emptyList}>
                    <span className={styles.emptyIcon}>
                        <ChatBubbleIcon size={26} />
                    </span>
                    <p>Диалогов пока нет</p>
                    <span>Начните переписку со страницы «Мои ученики» или «Мои репетиторы».</span>
                </div>
            );
        }

        if (visibleChats.length === 0) return <p className={styles.listMessage}>Никого не нашли</p>;

        return (
            <ul className={styles.dialogueList}>
                {visibleChats.map(chat => {
                    const companion = chat.companion;
                    const isActive = chat.chatId === activeChatId;
                    const hasUnread = chat.unreadCount > 0 && !isActive;
                    const isMine = chat.lastMessageSenderId && chat.lastMessageSenderId === userId;

                    return (
                        <li key={chat.chatId}>
                            <button
                                type='button'
                                className={[
                                    styles.dialogueItem,
                                    isActive ? styles.dialogueItemActive : '',
                                    hasUnread ? styles.dialogueItemUnread : '',
                                ].join(' ')}
                                onClick={() => openChat(chat.chatId)}
                                aria-current={isActive ? 'true' : undefined}
                            >
                                <Avatar
                                    src={companion.photoUrl}
                                    firstName={companion.firstName}
                                    lastName={companion.lastName}
                                    size={48}
                                    online={isUserOnline(sseData.userPresence, companion.id)}
                                />

                                <span className={styles.dialogueBody}>
                                    <span className={styles.dialogueTop}>
                                        <span className={styles.name}>{fullName(chat)}</span>
                                        <span className={styles.time}>{formatChatTime(chat.lastMessageTime)}</span>
                                    </span>
                                    <span className={styles.dialogueBottom}>
                                        <span className={styles.lastMessage}>
                                            {isMine && <span className={styles.youPrefix}>Вы: </span>}
                                            {chat.lastMessage || (
                                                <span className={styles.roleHint}>
                                                    {ROLE_LABELS[companion.role.id] ?? 'Нет сообщений'}
                                                </span>
                                            )}
                                        </span>
                                        {hasUnread && (
                                            <span className={styles.unreadBadge}>
                                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const renderConversation = () => {
        if (!hasActiveChat) {
            return (
                <div className={styles.placeholder}>
                    <span className={styles.placeholderIcon}>
                        <ChatBubbleIcon size={32} />
                    </span>
                    <h3>Выберите диалог</h3>
                    <p>Сообщения появятся здесь. Статус собеседника видно по точке на аватаре.</p>
                </div>
            );
        }

        if (!activeChat) {
            return (
                <div className={styles.placeholder}>
                    <h3>{isLoading ? 'Загружаем диалог…' : 'Чат не найден'}</h3>
                    {!isLoading && <p>Возможно, у вас нет доступа к этому диалогу.</p>}
                </div>
            );
        }

        return (
            <ChatComponent
                key={activeChat.companion.id}
                partner={activeChat.companion}
                onClose={closeChat}
                stopConnectionOnUnmount={stopChatConnection}
            />
        );
    };

    return (
        <div className={`${styles.page} ${hasActiveChat ? styles.pageChatOpen : ''}`}>
            <aside className={styles.sidebar} aria-label='Диалоги'>
                <div className={styles.sidebarHeader}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>Сообщения</h1>
                        <button
                            type='button'
                            className={styles.supportButton}
                            onClick={openSupport}
                            disabled={isOpeningSupport}
                            title='Написать администратору'
                        >
                            Поддержка
                        </button>
                    </div>
                    <label className={styles.search}>
                        <SearchIcon size={18} />
                        <input
                            type='search'
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder='Поиск по имени'
                            aria-label='Поиск по диалогам'
                        />
                    </label>
                </div>
                <div className={styles.sidebarBody}>{renderList()}</div>
            </aside>

            <section className={styles.conversation}>{renderConversation()}</section>
        </div>
    );
};

export default MessagesPage;
