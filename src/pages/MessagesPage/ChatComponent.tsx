import React, {useState, useEffect, useRef, JSX} from 'react';
import { useChat } from '../../shared/chat/useChat';
import { CompanionInfo } from '@api/chat';
// @ts-ignore
import styles from './ChatComponent.module.scss';
import { useAuth } from '../../shared/auth/AuthContext';
import { Avatar } from '@components/ui/Avatar/Avatar';
import {
    ArrowDownIcon,
    ArrowLeftIcon,
    CheckIcon,
    CloseIcon,
    DoubleCheckIcon,
    FileIcon,
    PaperclipIcon,
    SendIcon,
    UploadIcon,
} from '@components/ui/icons';

import { useSSE, isUserOnline } from "../../shared/sse/SSEComponent/SSEContext";

interface ChatComponentProps {
    partner: CompanionInfo | undefined;
    onClose: () => void;
    stopConnectionOnUnmount: () => Promise<void>;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ partner, onClose, stopConnectionOnUnmount }) => {
    const { state: chatState, sendMessage, startChatConnection, setActiveChat, loadHistory, leaveChat } = useChat();
    const { sseData } = useSSE();
    const { userId } = useAuth(); // Получаем ID текущего пользователя
    const messagesBoxRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<{ height: number; top: number }>({ height: 0, top: 0 });
    const isNewMessageRef = useRef(false);
    const messagesLengthRef = useRef(0);
    const isHistoryLoadingRef = useRef(false);

    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [newUnseenMessagesCount, setNewUnseenMessagesCount] = useState(0);

    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [sendError, setSendError] = useState<string | null>(null);

    const partnerIdToLoad = partner?.id;
    const isMountedRef = useRef(false);

    const [filesToSend, setFilesToSend] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const formatDateDelimiter = (dateString: string): string => {
        const messageDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        messageDate.setHours(0, 0, 0, 0);

        if (messageDate.getTime() === today.getTime()) {
            return 'Сегодня';
        }
        if (messageDate.getTime() === yesterday.getTime()) {
            return 'Вчера';
        }

        const year = messageDate.getFullYear();
        const currentYear = new Date().getFullYear();
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };

        if (year !== currentYear) {
            options.year = 'numeric';
        }

        return messageDate.toLocaleDateString('ru-RU', options);
    };

    useEffect(() => {
        if (!partnerIdToLoad) return;
        setActiveChat(partnerIdToLoad);

        return () => {
            if (isMountedRef.current) {
                setActiveChat(null);
                leaveChat()
                    .finally(() => {
                        stopConnectionOnUnmount();
                    });
            }
            isMountedRef.current = false;
        };

    }, [partnerIdToLoad, setActiveChat, stopConnectionOnUnmount, leaveChat]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {};
    }, []);

    useEffect(() => {
        if (partnerIdToLoad && chatState.status === 'disconnected') {
            startChatConnection();
        }
    }, [partnerIdToLoad, chatState.status, startChatConnection]);

    useEffect(() => {
        if (partnerIdToLoad && chatState.status === 'connected' && chatState.historyPage === 0) {
            setActiveChat(partnerIdToLoad);
        }
    }, [partnerIdToLoad, chatState.status, chatState.historyPage, setActiveChat]);


    useEffect(() => {
        const messagesBox = messagesBoxRef.current;
        if (!messagesBox) return;

        const SCROLL_TOLERANCE = 50;

        const handleScroll = () => {
            if (messagesBox.scrollTop === 0 && chatState.hasMoreHistory && chatState.activeChatUser && chatState.historyPage > 0) {

                scrollPositionRef.current = {
                    height: messagesBox.scrollHeight,
                    top: messagesBox.scrollTop
                };
                isHistoryLoadingRef.current = true;

                const nextPage = chatState.historyPage + 1;
                loadHistory(chatState.activeChatUser, nextPage);
            }

            const isNearBottom = messagesBox.scrollHeight - messagesBox.scrollTop <= messagesBox.clientHeight + SCROLL_TOLERANCE;
            if (isNearBottom !== isScrolledToBottom) {
                setIsScrolledToBottom(isNearBottom);
            }
        };

        messagesBox.addEventListener('scroll', handleScroll);

        return () => {
            messagesBox.removeEventListener('scroll', handleScroll);
        };
    }, [chatState.hasMoreHistory, chatState.historyPage, chatState.activeChatUser, loadHistory, isScrolledToBottom]);

    useEffect(() => {
        const messagesBox = messagesBoxRef.current;
        if (!messagesBox) return;

        const currentMessageCount = chatState.currentChatMessages.length;
        const isNewContent = currentMessageCount > messagesLengthRef.current;

        const isPaginating = chatState.historyPage > 1;
        const isSendingMessage = isNewMessageRef.current;

        const shouldScrollToBottom = isSendingMessage || isScrolledToBottom;

        if (isNewContent && !isSendingMessage && !isHistoryLoadingRef.current && !isScrolledToBottom) {
            setNewUnseenMessagesCount(prev => prev + 1);
        }
        messagesLengthRef.current = currentMessageCount;

        if (isSendingMessage) {

            const scrollTimeout = setTimeout(() => {
                if (messagesBox) {
                    messagesBox.scrollTo({
                        top: messagesBox.scrollHeight,
                        behavior: 'smooth'
                    });
                }
                isNewMessageRef.current = false;
                setIsScrolledToBottom(true);
                setNewUnseenMessagesCount(0);
            }, 0);

            return () => clearTimeout(scrollTimeout);
        }

        if (isPaginating) {
            if (isHistoryLoadingRef.current) {
                isHistoryLoadingRef.current = false;
            }
            if (scrollPositionRef.current.height > 0) {
                const oldHeight = scrollPositionRef.current.height;
                const newHeight = messagesBox.scrollHeight;
                const heightDifference = newHeight - oldHeight;
                messagesBox.scrollTop = heightDifference;
            }

            scrollPositionRef.current = { height: 0, top: 0 };
        } else if (shouldScrollToBottom) {

            const scrollTimeout = setTimeout(() => {
                if (messagesBox) {
                    messagesBox.scrollTo({
                        top: messagesBox.scrollHeight,
                        behavior: 'auto'
                    });
                }
                setNewUnseenMessagesCount(0);

            }, 0);

            return () => clearTimeout(scrollTimeout);
        }

    }, [chatState.currentChatMessages, chatState.historyPage, isScrolledToBottom, newUnseenMessagesCount]);

    useEffect(() => {
        const chatElement = messagesBoxRef.current?.closest(`.${styles.chatContainer}`) as HTMLDivElement | null;
        if (!chatElement) return;

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer?.types.includes('Files')) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!chatElement.contains(e.relatedTarget as Node)) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            handleFileSelection(e.dataTransfer?.files || null);
        };

        chatElement.addEventListener('dragenter', handleDragEnter as EventListener);
        chatElement.addEventListener('dragleave', handleDragLeave as EventListener);
        chatElement.addEventListener('dragover', handleDragOver as EventListener);
        chatElement.addEventListener('drop', handleDrop as EventListener);

        return () => {
            chatElement.removeEventListener('dragenter', handleDragEnter);
            chatElement.removeEventListener('dragleave', handleDragLeave);
            chatElement.removeEventListener('dragover', handleDragOver);
            chatElement.removeEventListener('drop', handleDrop);
        };
    }, [filesToSend.length]);






    if (!partner) {
        return <div className={styles.error}>Ошибка: не удалось найти информацию о собеседнике.</div>;
    }

    const messages = chatState.currentChatMessages;

    const isPartnerOnline = isUserOnline(sseData.userPresence, partner.id);
    const isSystemConnected = chatState.status === 'connected';

    const isMyMessage = (fromUserId: string) => fromUserId === userId || fromUserId === 'Me';

    const handleJumpToBottom = () => {
        messagesBoxRef.current?.scrollTo({
            top: messagesBoxRef.current.scrollHeight,
            behavior: 'smooth',
        });
        setNewUnseenMessagesCount(0);
        setIsScrolledToBottom(true);
    };

    const roleDisplayMap: Record<string, string> = {
        'student_or_parent': 'Ученик/Родитель',
        'admin': 'Администратор',
        'tutor': 'Репетитор',
    };

    const getRoleDisplayName = (roleId: string): string => {
        return roleDisplayMap[roleId] || roleId;
    };

    const sensitivePatterns = [
        /\+?(\s*\d\s*){7,15}/g,
        /(\d{4}[-\s]?){3}\d{4}/g,
        /@([a-zA-Z0-9_]{5,})/g
    ];

    const maskSensitiveData = (text: string): string => {
        let maskedText = text;

        sensitivePatterns.forEach(pattern => {
            maskedText = maskedText.replace(pattern, (match) => '*'.repeat(match.length));
        });

        return maskedText;
    };

    const handleFileSelection = (fileList: FileList | null) => {
        if (!fileList) return;

        const newFiles: File[] = [];
        let sizeExceeded = false;
        let countError = false;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            if (filesToSend.length + newFiles.length >= MAX_FILES) {
                countError = true;
                break;
            }

            if (file.size > MAX_FILE_SIZE) {
                sizeExceeded = true;
                continue;
            }
            newFiles.push(file);
        }

        setFilesToSend(prev => [...prev, ...newFiles]);

        if (countError) {
            setSendError(`Максимальное количество файлов: ${MAX_FILES}.`);
            setTimeout(() => setSendError(null), 5000);
        } else if (sizeExceeded) {
            setSendError(`Максимальный размер файла: ${MAX_FILE_SIZE / 1024 / 1024} МБ.`);
            setTimeout(() => setSendError(null), 5000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelection(e.target.files);
        e.target.value = '';
    };

    const handleRemoveFile = (fileName: string) => {
        setFilesToSend(prev => prev.filter(f => f.name !== fileName));
    };

    const MAX_FILENAME_LENGTH = 15;
    const MAX_EXTENSION_LENGTH = 5;

    const formatFileName = (fullName: string): string => {
        if (!fullName) return '';

        const lastDotIndex = fullName.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0) {
            return fullName;
        }

        const fileName = fullName.substring(0, lastDotIndex);
        const fileExtension = fullName.substring(lastDotIndex + 1);
        if (fileName.length > MAX_FILENAME_LENGTH) {
            const truncatedName = fileName.substring(0, MAX_FILENAME_LENGTH) + '...';
            return `${truncatedName}[${fileExtension.toUpperCase().substring(0, MAX_EXTENSION_LENGTH)}]`;
        }

        return `${fileName}[${fileExtension.toUpperCase().substring(0, MAX_EXTENSION_LENGTH)}]`;
    };

    const handleSend = async () => {
        const textToSend = inputText.trim();
        const hasFiles = filesToSend.length > 0;
        setSendError(null);

        if (!textToSend && !hasFiles) {
            return;
        }

        if (isSystemConnected) {
            isNewMessageRef.current = true;

            const finalMessage = textToSend ? maskSensitiveData(textToSend) : null;

            sendMessage(partner.id, finalMessage, filesToSend)
                .then(() => {
                    setInputText('');
                    setFilesToSend([]);
                })
                .catch(err => {
                    isNewMessageRef.current = false;
                    let errorMessage = 'Не удалось отправить сообщение.';
                    const match = err.message.match(/HubException:\s*(.*)$/);
                    if (match && match[1]) {
                        errorMessage = match[1].trim();
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    setSendError(errorMessage);
                    setTimeout(() => setSendError(null), 5000);
                });
        }
    };

    const renderedMessages: JSX.Element[] = [];
    let previousDateString = '';

    messages.forEach((msg, index) => {
        const currentMessageDate = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
        if (currentMessageDate && currentMessageDate !== previousDateString) {
            const formattedDate = formatDateDelimiter(msg.sentAt!);

            renderedMessages.push(
                <div key={`date-${index}`} className={styles.dateSeparator}>
                    <span>{formattedDate}</span>
                </div>
            );
            previousDateString = currentMessageDate;
        }

        if (msg.isAdminMessage) {
            renderedMessages.push(
                <div key={msg.id || index} className={styles.adminMessageRow}>
                    <div className={styles.adminMessage}>
                        <span className={styles.adminMessageLabel}>Администратор</span>
                        {msg.files?.map((file, fileIndex) => (
                            <a key={fileIndex} href={file.url} target="_blank" rel="noopener noreferrer" className={styles.adminMessageFile}>
                                {formatFileName(file.fileName)}
                            </a>
                        ))}
                        {msg.text && <p className={styles.messageText}>{msg.text}</p>}
                        <span className={styles.messageMeta}>
                            {new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            );
            return;
        }

        const mine = isMyMessage(msg.fromUserId);

        renderedMessages.push(
            <div
                key={msg.id || index}
                className={`${styles.messageRow} ${mine ? styles.messageRowMe : styles.messageRowPartner}`}
            >
                <div className={mine ? styles.messageMe : styles.messagePartner}>
                    {msg.files && msg.files.length > 0 && (
                        <div className={styles.fileList}>
                            {msg.files.map((file, fileIndex) => {
                                const isImage = file.contentType.startsWith('image/');

                                return isImage ? (
                                    <a
                                        key={fileIndex}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.imageLink}
                                    >
                                        <img src={file.url} alt={file.fileName} className={styles.imagePreview} />
                                    </a>
                                ) : (
                                    <a
                                        key={fileIndex}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={file.fileName}
                                        className={styles.fileItem}
                                        title={file.fileName}
                                    >
                                        <span className={styles.fileBadge}>
                                            <FileIcon size={18} />
                                        </span>
                                        <span className={styles.fileName}>{formatFileName(file.fileName)}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                    {msg.text && <p className={styles.messageText}>{msg.text}</p>}

                    {msg.sentByAdminId && (
                        <span className={styles.viaAdmin}>отправлено администратором</span>
                    )}

                    <span className={styles.messageMeta}>
                        {msg.sentAt
                            ? new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                            : 'Отправка…'}
                        {mine && (
                            <span
                                className={msg.isRead ? styles.readMark : styles.unreadMark}
                                title={msg.isRead ? 'Прочитано' : 'Доставлено'}
                                aria-label={msg.isRead ? 'Прочитано' : 'Доставлено'}
                            >
                                {msg.isRead ? <DoubleCheckIcon size={15} /> : <CheckIcon size={15} />}
                            </span>
                        )}
                    </span>
                </div>
            </div>
        );
    });

    return (
        <div className={styles.chatContainer}>
            <header className={styles.chatHeader}>
                <button type="button" onClick={onClose} className={styles.backButton} aria-label="Назад к диалогам">
                    <ArrowLeftIcon size={20} />
                </button>

                <Avatar
                    src={partner.photoUrl}
                    firstName={partner.firstName}
                    lastName={partner.lastName}
                    size={44}
                    online={isPartnerOnline}
                />

                <div className={styles.partnerDetails}>
                    <h3>{partner.firstName} {partner.lastName}</h3>
                    <div className={styles.partnerMeta}>
                        <span className={isPartnerOnline ? styles.statusOnline : styles.statusOffline}>
                            {isPartnerOnline ? 'в сети' : 'не в сети'}
                        </span>
                        <span className={styles.metaDot} aria-hidden="true">·</span>
                        <span>{getRoleDisplayName(partner.role.id)}</span>
                    </div>
                </div>

                {!isSystemConnected && messages.length > 0 && (
                    <span className={styles.connectionBadge}>Подключение…</span>
                )}
            </header>

            <div className={`${styles.messagesBox} ${isDragging ? styles.dragOver : ''}`} ref={messagesBoxRef}>
                {isDragging && (
                    <div className={styles.dragDropOverlay}>
                        <UploadIcon size={28} />
                        Отпустите файлы, чтобы прикрепить
                    </div>
                )}

                {chatState.error && <p className={styles.statusError}>Ошибка: {chatState.error}</p>}
                {chatState.status !== 'connected' && messages.length === 0 && (
                    <p className={styles.statusMessage}>Загружаем диалог…</p>
                )}
                {chatState.status === 'connected' && messages.length === 0 && chatState.activeChatUser === partner.id && (
                    <div className={styles.emptyChat}>
                        <Avatar src={partner.photoUrl} firstName={partner.firstName} lastName={partner.lastName} size={64} />
                        <p>Сообщений пока нет</p>
                        <span>Напишите первым — {partner.firstName} получит уведомление.</span>
                    </div>
                )}
                {renderedMessages}
                <div ref={messagesEndRef} />
            </div>

            {newUnseenMessagesCount > 0 && !isScrolledToBottom && (
                <button type="button" className={styles.jumpToBottomButton} onClick={handleJumpToBottom}>
                    <ArrowDownIcon size={16} />
                    <span>{newUnseenMessagesCount}</span>
                </button>
            )}

            <footer className={styles.composer}>
                {sendError && <p className={styles.sendErrorMessage}>{sendError}</p>}

                {filesToSend.length > 0 && (
                    <div className={styles.filePreviewArea}>
                        {filesToSend.map((file, index) => (
                            <div key={index} className={styles.filePreviewItem}>
                                <FileIcon size={16} />
                                <span className={styles.filePreviewName}>{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(file.name)}
                                    className={styles.fileRemoveButton}
                                    aria-label={`Удалить файл ${file.name}`}
                                >
                                    <CloseIcon size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.inputArea}>
                    <input
                        type="file"
                        id="file-upload-input"
                        multiple
                        hidden
                        onChange={handleFileChange}
                    />
                    <label
                        htmlFor="file-upload-input"
                        className={styles.iconButton}
                        title={`Прикрепить файл (до ${MAX_FILES})`}
                        aria-label="Прикрепить файл"
                    >
                        <PaperclipIcon size={20} />
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.messageInput}
                        value={inputText}
                        onChange={(e) => setInputText(maskSensitiveData(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        placeholder={isSystemConnected ? 'Напишите сообщение…' : 'Подключаемся к чату…'}
                        disabled={!isSystemConnected}
                    />
                    <button
                        type="button"
                        className={styles.sendButton}
                        onClick={handleSend}
                        disabled={!isSystemConnected || (!inputText.trim() && filesToSend.length === 0)}
                        aria-label="Отправить сообщение"
                    >
                        <SendIcon size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ChatComponent;
