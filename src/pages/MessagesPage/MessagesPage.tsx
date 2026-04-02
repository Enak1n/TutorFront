import React, { useState, useEffect, useCallback } from 'react';
import { fetchMyChats, ChatPreview, CompanionInfo } from '@api/chat';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../shared/chat/useChat';
import ChatComponent from './ChatComponent';
// @ts-ignore
import styles from './MessagesPage.module.scss';
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif'
import {useSSE} from "../../shared/sse/SSEComponent/SSEContext";

const MessagesPage: React.FC = () => {
    const { chatId: urlChatId } = useParams<{ chatId: string }>(); // Получаем chatId из URL
    const navigate = useNavigate();
    const { stopChatConnection } = useChat();

    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [companionForChat, setCompanionForChat] = useState<CompanionInfo | undefined>(undefined);

    const { resetNotificationCount, sseData } = useSSE()

    useEffect(() => {
        if (resetNotificationCount) {
            resetNotificationCount();
        }
    }, [resetNotificationCount]);


    useEffect(() => {
        let isCancelled = false;

        const loadChats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchMyChats();
                if (isCancelled) return;

                setChats(data);

                if (urlChatId) {
                    const activeChat = data.find(chat => chat.chatId === urlChatId);
                    if (activeChat) {
                        setCompanionForChat(activeChat.companion);
                    } else {
                        setCompanionForChat(undefined);
                    }
                } else {
                    setCompanionForChat(undefined);
                }

                setIsLoading(false);
            } catch (err: any) {
                if (!isCancelled) {
                    setError('Не удалось загрузить список чатов. ' + (err.message || 'Произошла ошибка.'));
                    setIsLoading(false);
                }
            }
        };

        loadChats();

        return () => {
            isCancelled = true;
        };
    }, [urlChatId]);

    const handleChatClick = useCallback((chat: ChatPreview) => {
        navigate(`/messages/${chat.chatId}`);
    }, [navigate]);

    const handleChatClose = useCallback(() => {
        navigate('/messages');
    }, [navigate]);

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
                    alt="Загрузка календаря..."
                    style={{
                        width: '80px',
                        height: '80px',
                        marginBottom: '10px'
                    }}
                />
                <div>Загрузка чатов...</div>
            </div>
        );
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (urlChatId && companionForChat) {
        return (
            <div className={styles.container}>
                <ChatComponent
                    partner={companionForChat}
                    onClose={handleChatClose}
                    stopConnectionOnUnmount={stopChatConnection}
                />
            </div>
        );
    }

    if (urlChatId && !companionForChat) {
        return <div className={styles.error}>Чат не найден или у вас нет доступа.</div>;
    }

    const roleDisplayMap: Record<string, string> = {
        'student_or_parent': 'Ученик/Родитель',
        'admin': 'Администратор',
        'tutor': 'Репетитор',
    };

    const getRoleDisplayName = (roleId: string): string => {
        return roleDisplayMap[roleId] || roleId;
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.pageTitle}>Сообщения</h2>
            <div className={styles.dialogueList}>
                {chats.length === 0 ? (
                    <p className={styles.emptyList}>Активных диалогов нет.</p>
                ) : (
                    chats.map(chat => {
                        const companion = chat.companion;

                        const isOnline = sseData.userPresence[companion.id] === 'online';

                        const formattedTime = chat.lastMessageTime
                            ? new Date(chat.lastMessageTime).toLocaleDateString()
                            : '';

                        const lastMessageText = chat.lastMessage || 'Нет сообщений';
                        const hasUnread = chat.unreadCount > 0;

                        return (
                            <div
                                key={chat.chatId}
                                className={styles.dialogueItem}
                                onClick={() => handleChatClick(chat)}
                            >
                                <div className={styles.avatarContainer}>
                                    <img
                                        src={companion.photoUrl || '/default-avatar.png'}
                                        alt={companion.firstName}
                                        className={styles.avatar}
                                    />
                                    {isOnline && (
                                        <span className={styles.statusIndicator} />
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.header}>
                                        <span className={styles.name}>
                                            {companion.firstName} {companion.lastName}
                                            <span className={styles.role}>({getRoleDisplayName(companion.role.id)})</span>
                                        </span>
                                        <span className={styles.date}>
                                            {formattedTime}
                                        </span>
                                    </div>
                                    <p className={styles.lastMessage} style={{ fontWeight: hasUnread ? 'bold' : 'normal' }}>
                                        {lastMessageText}
                                    </p>
                                </div>
                                {hasUnread && (
                                    <span className={styles.unreadBadge}>{chat.unreadCount}</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MessagesPage;