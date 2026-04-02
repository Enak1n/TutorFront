import React, {useState, useEffect, useRef, JSX} from 'react';
import { useChat } from '../../shared/chat/useChat';
import { CompanionInfo } from '@api/chat';
// @ts-ignore
import styles from './ChatComponent.module.scss';
import { useAuth } from '../../shared/auth/AuthContext';
// @ts-ignore
import icon_enter from '@icons/enter_icon.svg'
// @ts-ignore
import icon_close from '@icons/close_icon.svg'
// @ts-ignore
import icon_file_add from '@icons/add_file.svg'
// @ts-ignore
import icon_file from '@icons/file.svg'
// @ts-ignore
import file_download from '@icons/file_add.svg'

import { useSSE } from "../../shared/sse/SSEComponent/SSEContext";

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

    const isPartnerOnline = sseData.userPresence[partner.id] === 'online';
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

        renderedMessages.push(
            <div
                key={msg.id || index}
                className={isMyMessage(msg.fromUserId) ? styles.messageMe : styles.messagePartner}
            >
                {msg.files && msg.files.length > 0 && (
                    <div className={styles.fileList}>
                        {msg.files && msg.files.length > 0 && (
                            <div className={styles.fileList}>
                                {msg.files.map((file, fileIndex) => {
                                    const isImage = file.contentType.startsWith('image/');

                                    return (
                                        <div
                                            key={fileIndex}
                                            className={isImage ? styles.imageItem : styles.fileItem}
                                        >

                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download={file.fileName}
                                                className={isImage ? styles.imageLink : styles.fileLink}
                                            >
                                                {isImage ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.fileName}
                                                        className={styles.imagePreview}
                                                    />
                                                ) : (
                                                    <img
                                                        src={file_download}
                                                        alt="Файл"
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
                    </div>
                )}
                {msg.text && <p className={styles.messageText}>{msg.text}</p>}

                <span className={styles.messageTime}>
                {msg.sentAt ?
                    new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Отправка...'
                }
                    {isMyMessage(msg.fromUserId) && (
                        <span
                            className={msg.isRead ? styles.readMark : styles.unreadMark}
                            title={msg.isRead ? 'Прочитано' : 'Доставлено'}
                        >
                        {' ✓✓'}
                    </span>
                    )}
            </span>
            </div>
        );
    });

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <button onClick={onClose} className={styles.backButton}>&larr; Назад</button>
                <div className={styles.partnerInfo}>
                    <img src={partner.photoUrl || '/default-avatar.png'} alt={partner.firstName} className={styles.partnerAvatar} />

                    <div className={styles.partnerDetails}>
                        <h3>{partner.firstName} {partner.lastName}</h3>
                        <div className={styles.partnerRoleAndStatus}>
                            <span className={styles.partnerRole}>({getRoleDisplayName(partner.role.id)})</span>
                            <span
                                className={isPartnerOnline ? styles.partnerStatusOnline : styles.partnerStatusOffline}
                            >
                                &bull; {isPartnerOnline ? 'онлайн' : 'офлайн'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.chatStatus}>
                    Соединение: <span className={isSystemConnected ? styles.statusConnected : styles.statusDisconnected}>
                        {chatState.status}
                    </span>
                </div>
            </div>

            <div className={`${styles.messagesBox} ${isDragging ? styles.dragOver : ''}`} ref={messagesBoxRef}>
                {isDragging && (
                    <div className={styles.dragDropOverlay}>
                        Отпустите файлы для загрузки
                    </div>
                )}

                {chatState.error && <p className={styles.statusError}>Ошибка: {chatState.error}</p>}
                {chatState.status !== 'connected' && <p className={styles.statusMessage}>Идет подключение к серверу...</p>}
                {chatState.status === 'connected' && messages.length === 0 && chatState.activeChatUser === partner.id &&
                    <p className={styles.statusMessage}>Начните диалог первым!</p>
                }
                {renderedMessages}
                <div ref={messagesEndRef} />
            </div>
            {newUnseenMessagesCount > 0 && !isScrolledToBottom && (
                <div className={styles.jumpToBottomButton} onClick={handleJumpToBottom}>
                    <span>&#x25BC; {newUnseenMessagesCount}</span>
                </div>
            )}

            {sendError && (
                <div className={styles.sendErrorContainer}>
                    <p className={styles.sendErrorMessage}>{sendError}</p>
                </div>
            )}

            <div className={styles.filePreviewArea}>
                {filesToSend.map((file, index) => (
                    <div key={index} className={styles.filePreviewItem}>
                        <img src={icon_file} alt="Файл" className={styles.filePreviewIcon} />
                        <span className={styles.filePreviewName}>{file.name}</span>
                        <button
                            onClick={() => handleRemoveFile(file.name)}
                            className={styles.fileRemoveButton}
                        >
                            <img src={icon_close} alt="Удалить" />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.inputArea}>
                <input
                    type="file"
                    id="file-upload-input"
                    multiple
                    accept="*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <label
                    htmlFor="file-upload-input"
                    className={styles.fileUploadButton}
                    title={`Добавить файл (макс. ${MAX_FILES})`}
                >
                    <img src={icon_file_add} alt="Добавить файл" />
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                        const maskedValue = maskSensitiveData(e.target.value);
                        setInputText(maskedValue);
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    placeholder={isSystemConnected ? 'Введите сообщение...' : 'Подключение не установлено...'}
                    disabled={!isSystemConnected}
                />
                <button onClick={handleSend} disabled={!isSystemConnected || (!inputText.trim() && filesToSend.length === 0)}>
                    <img src={icon_enter} alt="Отправить" />
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;