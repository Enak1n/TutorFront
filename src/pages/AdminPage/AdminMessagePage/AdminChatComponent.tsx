import React, {useState, useEffect, useRef, useCallback} from 'react';
import { fetchAdminChatHistory, UserInfo, deleteChatMessage } from '@api/admin-message';
import { ChatMessage } from '../../../shared/chat/chatTypes';
import { useAlert } from '@components/ui/alert/AlertContext';
// @ts-ignore
import styles from './AdminChatComponent.module.scss';
// @ts-ignore
import loading_gif from '@images/loading_drop_list.gif';
// @ts-ignore
import file_download from '@icons/file_add.svg'
// @ts-ignore
import trash from '@icons/trash.svg'

interface AdminChatProps {
    chatId: string;
    firstUser: UserInfo;
    secondUser: UserInfo;
    onClose: () => void;
}

const PAGE_SIZE = 30;
const API_BASE_URL = 'https://api.ugolok-repetitora.ru';

const AdminChatComponent: React.FC<AdminChatProps> = ({ chatId, firstUser, secondUser, onClose }) => {
    const { showAlert, showConfirm } = useAlert();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesBoxRef = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(true);

    const scrollPositionRef = useRef<{ height: number; top: number }>({ height: 0, top: 0 });

    useEffect(() => {
        let isCancelled = false;

        if (page !== 1 && messages.length === 0) {
            setPage(1);
            return;
        }

        const load = async () => {
            if (isLoading) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetchAdminChatHistory({
                    chatId,
                    page,
                    pageSize: PAGE_SIZE
                });

                if (isCancelled) return;

                const newMessages = response.messages.reverse();

                setMessages(prev => {
                    if (page === 1 && prev.length === 0) {
                        return newMessages;
                    }
                    return [...newMessages, ...prev];
                });

                // Проверка, есть ли еще сообщения
                setHasMore(response.messages.length === PAGE_SIZE);

                setIsLoading(false);

                if (page === 1) {
                    setTimeout(scrollToBottom, 50);
                }
            } catch (err: any) {
                if (!isCancelled) {
                    console.error("Ошибка при загрузке сообщений админом:", err);
                    setError('Не удалось загрузить историю чата.');
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => { isCancelled = true; };
    }, [chatId, page]);

    const scrollToBottom = () => {
        const messagesBox = messagesBoxRef.current;
        if (messagesBox) {
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }
    };

    useEffect(() => {
        const messagesBox = messagesBoxRef.current;
        if (messagesBox && !isLoading && page > 1) {
            const timer = setTimeout(() => {

                if (messagesBox && scrollPositionRef.current.height > 0) {

                    const oldHeight = scrollPositionRef.current.height;
                    const newHeight = messagesBox.scrollHeight;
                    const heightDifference = newHeight - oldHeight;

                    if (heightDifference > 0) {
                        messagesBox.scrollTop = heightDifference;
                    }
                }
                scrollPositionRef.current = { height: 0, top: 0 };
            }, 50);
            return () => clearTimeout(timer);
        }
        return () => {};
    }, [messages.length, isLoading, page]);

    const handleScroll = useCallback(() => {
        const element = messagesBoxRef.current;
        if (element && element.scrollTop === 0 && !isLoading && hasMore) {
            scrollPositionRef.current = {
                height: element.scrollHeight,
                top: element.scrollTop
            };
            setPage(prev => prev + 1);
        }
    }, [isLoading, hasMore]);

    useEffect(() => {
        const element = messagesBoxRef.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    const handleDeleteMessage = (messageId: string) => {
        showConfirm(
            "Вы уверены, что хотите удалить это сообщение? Это действие необратимо.",
            async () => {
                try {
                    await deleteChatMessage({ messageId });

                    setMessages(prevMessages =>
                        prevMessages.filter(msg => msg.id !== messageId)
                    );

                    showAlert('Сообщение успешно удалено.', 'success');
                } catch (err) {
                    console.error('Ошибка удаления сообщения:', err);
                    const message = (err as any).response?.data?.message || 'Не удалось удалить сообщение.';
                    showAlert(message, 'error');
                }
            },
            'warning'
        );
    };

    const getPartnerInfo = (userId: string) => {
        return userId === firstUser.id ? firstUser : secondUser;
    };

    const formatDateDelimiter = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return 'Сегодня';
        } else if (isYesterday) {
            return 'Вчера';
        } else if (date.getFullYear() === now.getFullYear()) {
            // "24 ноября"
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        } else {
            // "22 ноября 2024"
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const formatFileName = (name: string, maxLength: number = 30): string => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    };

    const roleDisplayMap: Record<string, string> = {
        'student_or_parent': 'Ученик/Родитель',
        'admin': 'Администратор',
        'tutor': 'Репетитор',
    };

    const getRoleDisplayName = (roleId: string): string => {
        return roleDisplayMap[roleId] || roleId;
    };


    const renderedMessages: React.ReactNode[] = [];
    let previousDateString: string | null = null;

    messages.forEach((msg, index) => {
        const sender = getPartnerInfo(msg.fromUserId);
        const isMe = msg.fromUserId === firstUser.id;
        const nameParts = [sender.firstName, sender.lastName].filter(
            (part) => part && part.trim() !== ''
        );
        const senderName = nameParts.join(' ') || 'Неизвестный пользователь';

        const currentMessageDate = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';

        if (currentMessageDate && currentMessageDate !== previousDateString) {
            const formattedDate = formatDateDelimiter(msg.sentAt!);

            renderedMessages.push(
                <div key={`date-${msg.id || index}`} className={styles.dateSeparator}>
                    <span>{formattedDate}</span>
                </div>
            );
            previousDateString = currentMessageDate;
        }

        renderedMessages.push(
            <div
                key={msg.id || index}
                className={isMe ? styles.messageMeWrapper : styles.messagePartnerWrapper}
            >
                <div className={isMe ? styles.messageMe : styles.messagePartner}>
                    {msg.id && (
                        <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteMessage(msg.id!)}
                            title="Удалить сообщение"
                        >
                            <img src={trash} alt="Удалить" />
                        </button>
                    )}

                <div className={styles.senderHeader}>
                    <span className={styles.senderName}>{senderName}</span>
                    <span className={styles.senderRole}>({getRoleDisplayName(sender.role.id)})</span>
                </div>

                {/* --- ЛОГИКА РЕНДЕРИНГА ФАЙЛОВ --- */}
                {msg.files && msg.files.length > 0 && (
                    <div className={styles.fileList}>
                        {msg.files.map((file, fileIndex) => {
                            const isImage = file.contentType && file.contentType.startsWith('image/');
                            const fullFileUrl = `${API_BASE_URL}${file.url}`;

                            return (
                                <div
                                    key={fileIndex}
                                    className={isImage ? styles.imageItem : styles.fileItem}
                                >
                                    <a
                                        href={fullFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={isImage ? styles.imageLink : styles.fileLink}
                                    >
                                        {isImage ? (
                                            <img
                                                src={fullFileUrl}
                                                alt={file.fileName}
                                                className={styles.imagePreview}
                                            />
                                        ) : (
                                            <img
                                                src={file_download}
                                                alt={`Файл: ${file.fileName}`}
                                                className={styles.fileIconLarge}
                                            />
                                        )}
                                    </a>

                                    {!isImage && (
                                        <div className={styles.fileDetails}>
                                        <span className={styles.fileName}>
                                            {formatFileName(file.fileName)}
                                        </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {msg.text && (
                    <p className={styles.messageText}>{msg.text}</p>
                )}

                <span className={styles.messageTime}>
                    {msg.sentAt ?
                        new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : '...'
                    }
                </span>
            </div>
            </div>
        );
    });

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <button onClick={onClose} className={styles.backButton}>&larr; Назад</button>
                <div className={styles.partnerInfo}>
                    <h3 className={styles.headerTitle}>
                        {firstUser.firstName} {firstUser.lastName} ({getRoleDisplayName(firstUser.role.id)})
                        <span className={styles.separator}> &harr; </span>
                        {secondUser.firstName} {secondUser.lastName} ({getRoleDisplayName(secondUser.role.id)})
                    </h3>
                </div>
            </div>

            <div className={styles.messagesBox} ref={messagesBoxRef}>
                {isLoading && page > 1 && (
                    <div className={styles.loadingMore}>
                        <img src={loading_gif} alt="Загрузка" style={{ width: '30px' }} />
                        <span>Загружаем старые сообщения...</span>
                    </div>
                )}
                {isLoading && messages.length === 0 && (
                    <div className={styles.loadingMore}>
                        <img src={loading_gif} alt="Загрузка" style={{ width: '30px' }} />
                        <span>Загрузка чата...</span>
                    </div>
                )}

                {error && <div className={styles.statusError}>{error}</div>}

                {/* ИСПОЛЬЗУЕМ МАССИВ С РАЗДЕЛИТЕЛЯМИ */}
                {renderedMessages}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default AdminChatComponent;