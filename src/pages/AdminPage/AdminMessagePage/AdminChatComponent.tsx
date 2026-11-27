import React, {useState, useEffect, useRef, useCallback} from 'react';
import { fetchAdminChatHistory, UserInfo, deleteChatMessage, sendAdminMessage } from '@api/admin-message';
import { uploadFiles, getApiErrorMessage } from '@api/files';
import { useAuth } from '@auth/AuthContext';
import { ChatMessage } from '../../../shared/chat/chatTypes';
import { useAlert } from '@components/ui/alert/AlertContext';
import { toApiUrl } from '@/shared/config/api';
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

    // --- Отправка сообщений администратором ---
    const { userId: adminId } = useAuth();
    const adminIsParticipant = firstUser.id === adminId || secondUser.id === adminId;
    const [sendAs, setSendAs] = useState<string>('admin');
    const [draft, setDraft] = useState('');
    const [draftFiles, setDraftFiles] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userLabel = (user: UserInfo) =>
        [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Без имени';

    const handleSend = async () => {
        const text = draft.trim();
        if ((!text && draftFiles.length === 0) || isSending) return;

        setIsSending(true);
        try {
            const files = draftFiles.length > 0 ? await uploadFiles(draftFiles) : [];
            const message = await sendAdminMessage({
                chatId,
                asUserId: sendAs === 'admin' ? null : sendAs,
                text: text || null,
                files,
            });
            setMessages(prev => [...prev, message]);
            setDraft('');
            setDraftFiles([]);
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            showAlert(getApiErrorMessage(err, 'Не удалось отправить сообщение'), 'error');
        } finally {
            setIsSending(false);
        }
    };

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
        const isOwnAdminMessage = msg.isAdminMessage || (msg.fromUserId !== firstUser.id && msg.fromUserId !== secondUser.id);
        if (isOwnAdminMessage) {
            const dateKey = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
            if (dateKey && dateKey !== previousDateString) {
                renderedMessages.push(
                    <div key={`date-${msg.id || index}`} className={styles.dateSeparator}>
                        <span>{formatDateDelimiter(msg.sentAt!)}</span>
                    </div>
                );
                previousDateString = dateKey;
            }
            renderedMessages.push(
                <div key={msg.id || index} className={styles.adminMessageRow}>
                    <div className={styles.adminMessage}>
                        {msg.id && (
                            <button className={styles.adminDelete} onClick={() => handleDeleteMessage(msg.id!)} title="Удалить сообщение">
                                <img src={trash} alt="Удалить" />
                            </button>
                        )}
                        <span className={styles.adminMessageLabel}>Администратор · видят оба участника</span>
                        {msg.files?.map((file, i) => (
                            <a key={i} href={toApiUrl(file.url)} target="_blank" rel="noopener noreferrer" className={styles.adminFile}>
                                {formatFileName(file.fileName)}
                            </a>
                        ))}
                        {msg.text && <p className={styles.messageText}>{msg.text}</p>}
                        <span className={styles.messageTime}>
                            {new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            );
            return;
        }

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
                    {msg.sentByAdminId && <span className={styles.viaAdmin}>· отправил администратор</span>}
                </div>

                {/* --- ЛОГИКА РЕНДЕРИНГА ФАЙЛОВ --- */}
                {msg.files && msg.files.length > 0 && (
                    <div className={styles.fileList}>
                        {msg.files.map((file, fileIndex) => {
                            const isImage = file.contentType && file.contentType.startsWith('image/');
                            const fullFileUrl = toApiUrl(file.url);

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

            <div className={styles.composer}>
                <div className={styles.composerTop}>
                    <label className={styles.sendAsLabel}>
                        От имени:
                        <select
                            className={styles.sendAsSelect}
                            value={sendAs}
                            onChange={e => setSendAs(e.target.value)}
                            disabled={isSending}
                        >
                            <option value="admin">
                                {adminIsParticipant ? 'Администратора (вас)' : 'Администратора — увидят оба'}
                            </option>
                            {[firstUser, secondUser]
                                .filter(user => user.id !== adminId)
                                .map(user => (
                                    <option key={user.id} value={user.id}>
                                        {userLabel(user)} ({getRoleDisplayName(user.role.id)})
                                    </option>
                                ))}
                        </select>
                    </label>
                    {sendAs !== 'admin' && (
                        <span className={styles.sendAsHint}>
                            Сообщение уйдёт собеседнику с пометкой «отправлено администратором»
                        </span>
                    )}
                </div>

                {draftFiles.length > 0 && (
                    <div className={styles.draftFiles}>
                        {draftFiles.map((file, i) => (
                            <span key={i} className={styles.draftFile}>
                                {formatFileName(file.name, 24)}
                                <button
                                    type="button"
                                    onClick={() => setDraftFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    aria-label="Убрать файл"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className={styles.composerRow}>
                    <button
                        type="button"
                        className={styles.attachButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        title="Прикрепить файлы"
                    >
                        <img src={file_download} alt="" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={e => {
                            const selected = Array.from(e.target.files ?? []);
                            setDraftFiles(prev => [...prev, ...selected].slice(0, 10));
                            e.target.value = '';
                        }}
                    />
                    <textarea
                        className={styles.composerInput}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Сообщение…"
                        rows={1}
                        maxLength={4000}
                        disabled={isSending}
                    />
                    <button
                        type="button"
                        className={styles.sendButton}
                        onClick={handleSend}
                        disabled={isSending || (!draft.trim() && draftFiles.length === 0)}
                    >
                        {isSending ? '…' : 'Отправить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminChatComponent;