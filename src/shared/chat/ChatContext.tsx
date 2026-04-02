import React, { createContext, useState, useMemo, ReactNode, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {ChatState, ChatContextType, ChatMessage, FileToSend, ChatFile} from './chatTypes';
import { useAuth } from '../auth/AuthContext';
import {fileToBytes} from "../utils/fileConverter.ts";

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_HUB_URL = 'https://api.ugolok-repetitora.ru/chatHub';
const API_BASE_URL = 'https://api.ugolok-repetitora.ru/';

// const CHAT_HUB_URL = 'http://localhost:5211/chatHub';
// const API_BASE_URL = 'http://localhost:5211/';

const initialState: ChatState = {
    connection: null,
    status: 'disconnected',
    error: null,
    currentChatMessages: [],
    activeChatUser: null,
    unreadCount: 0,
    onlineUsers: {},
    historyPage: 1,
    hasMoreHistory: true,
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ChatState>(initialState);
    const { token, userId } = useAuth();

    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const internalMarkAsRead = useCallback(async (fromUserId: string) => {
        const connection = connectionRef.current;
        if (connection?.state === signalR.HubConnectionState.Connected && userId) {
            try {
                await connection.invoke('MarkAsRead', fromUserId);

                setState(prev => ({
                    ...prev,
                    currentChatMessages: prev.currentChatMessages.map(msg =>
                        (msg.fromUserId === fromUserId && msg.toUserId === userId) ? { ...msg, isRead: true } : msg
                    )
                }));
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
    }, [userId]);

    const markAsRead = useCallback((fromUserId: string) => {
        internalMarkAsRead(fromUserId);
    }, [internalMarkAsRead]);

    const getFullUrl = useCallback((relativeUrl: string): string => {
        if (!relativeUrl) return '';
        const cleanRelativeUrl = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
        return `${API_BASE_URL}${cleanRelativeUrl}`;
    }, []);

    const loadHistory = useCallback(async (withUserId: string, page: number = 1, pageSize: number = 30) => {
        if (!withUserId) {
            setState(prev => ({ ...prev, currentChatMessages: [] }));
            return;
        }

        const connection = connectionRef.current;
        if (connection?.state === signalR.HubConnectionState.Connected) {
            try {
                if (page === 1) {
                    await connection.invoke('JoinChat', withUserId);
                }

                const history = await connection.invoke('GetHistory', withUserId, page, pageSize);
                console.log("History received:", history);

                const typedHistory: ChatMessage[] = history as ChatMessage[];

                setState(prev => {
                    const processedHistory = typedHistory.map(msg => ({
                        ...msg,
                        files: msg.files?.map(f => ({
                            ...f,
                            url: f.url ? getFullUrl(f.url) : f.url
                        })) ?? null
                    }));

                    const newMessagesInCorrectOrder = [...processedHistory].reverse();
                    const hasMore = typedHistory.length === pageSize;

                    const existingIds = new Set(prev.currentChatMessages.map(msg => msg.id));
                    const trulyNewMessages = newMessagesInCorrectOrder.filter(msg => !existingIds.has(msg.id));

                    const updatedMessages = page === 1
                        ? trulyNewMessages
                        : [...trulyNewMessages, ...prev.currentChatMessages];
                    if (page === 1) {
                        markAsRead(withUserId);
                    }

                    return {
                        ...prev,
                        currentChatMessages: updatedMessages,
                        historyPage: page,
                        hasMoreHistory: hasMore,
                    };
                });

                markAsRead(withUserId);
            } catch (err) {
                console.error('Failed to load history:', err);
                setState(prev => ({
                    ...prev,
                    currentChatMessages: [],
                    error: "Ошибка загрузки истории. Проверьте консоль и убедитесь, что ID партнера является GUID."
                }));
            }
        } else {
            console.warn(`Cannot load history: SignalR connection is not ready. Current state: ${connection?.state}`);
        }
    }, [markAsRead, getFullUrl]);

    const setupConnectionHandlers = useCallback((connectionToStart: signalR.HubConnection) => {
        connectionToStart.on("ReceiveUserStatus", (fromUserId: string, isOnline: boolean) => {
            setState(prev => ({
                ...prev,
                onlineUsers: {
                    ...prev.onlineUsers,
                    [fromUserId]: isOnline
                }
            }));
            console.log(`[Chat] User ${fromUserId} is now ${isOnline ? 'online' : 'offline'}.`);
        });

        connectionToStart.on(
            'ReceiveMessage',
            (msg: { messageId: string, fromUserId: string; text: string | null; sentAt: string, files: ChatFile[] | null }) => {
                const fromUserId = msg.fromUserId;
                console.log(`[Chat] Отправленное сообщение ${fromUserId}. Message object:`, msg);

                setState(prev => {
                    const currentUserId = userId || 'unknown';
                    const normalizedFromUserId = fromUserId.toLowerCase();
                    const normalizedCurrentUserId = currentUserId.toLowerCase();
                    const normalizedActiveChatUser = prev.activeChatUser?.toLowerCase();

                    const isSelfSentConfirmation = normalizedFromUserId === normalizedCurrentUserId;

                    const isMessageFromActivePartner = normalizedFromUserId === normalizedActiveChatUser;

                    const messageToUserId = isSelfSentConfirmation
                        ? prev.activeChatUser || ''
                        : currentUserId;

                    const shouldAddToCurrentChat = isMessageFromActivePartner ||
                        (isSelfSentConfirmation && messageToUserId === normalizedActiveChatUser);

                    const finalMessage: ChatMessage = {
                        id: msg.messageId,
                        fromUserId: fromUserId,
                        toUserId: messageToUserId,
                        text: msg.text || '',
                        sentAt: msg.sentAt,
                        isRead: shouldAddToCurrentChat && !isSelfSentConfirmation,
                        files: msg.files?.map(f => ({
                            ...f,
                            url: f.url ? getFullUrl(f.url) : f.url
                        })) ?? null
                    };

                    let updatedMessages = [...prev.currentChatMessages];

                    if (shouldAddToCurrentChat) {
                        const isAlreadyAdded = updatedMessages.some(m => m.id === finalMessage.id);

                        if (!isAlreadyAdded) {
                            updatedMessages.push(finalMessage);
                        } else {
                            console.log(`[Chat Receive] Сообщение ${finalMessage.id} уже присутствует в списке.`);
                        }
                    }

                    const shouldIncrementUnread = !isSelfSentConfirmation && !shouldAddToCurrentChat;

                    const newState = {
                        ...prev,
                        currentChatMessages: updatedMessages,
                        unreadCount: shouldIncrementUnread ? prev.unreadCount + 1 : prev.unreadCount
                    };

                    if (shouldAddToCurrentChat && !isSelfSentConfirmation) {
                        markAsRead(fromUserId);
                    }

                    return newState;
                });
            }
        );

        connectionToStart.on('ReadMessage', (readerId: string) => {
            setState(prev => ({
                ...prev,
                currentChatMessages: prev.currentChatMessages.map(msg =>
                    (msg.toUserId === readerId && (msg.fromUserId === userId || msg.fromUserId === 'Me'))
                        ? {...msg, isRead: true}
                        : msg
                )
            }));
            console.log(`[Chat] User ${readerId} marked messages as read.`);
        });

        connectionToStart.onreconnecting(error => {
            setState(prev => ({...prev, status: 'reconnecting', error: error?.message || 'Reconnecting...'}));
        });

        connectionToStart.onreconnected(connectionId => {
            let userToReconnect: string | null = null;

            setState(prev => {
                userToReconnect = prev.activeChatUser;
                return {...prev, status: 'connected', error: null};
            });

            console.log(`[Chat] Reconnected. ConnectionId: ${connectionId}`);

            if (userToReconnect) {
                loadHistory(userToReconnect, 1);
            }
        });

        connectionToStart.onclose(error => {
            console.log('[Chat] Соединение закрыто.', error);
            connectionRef.current = null;
            setState(prev => ({
                ...prev,
                status: 'disconnected',
                connection: null,
                error: error?.message || 'Connection closed unexpectedly',
                activeChatUser: null,
                currentChatMessages: [],
            }));
        });
    }, [userId, markAsRead, loadHistory]);

    const startChatConnection = useCallback(async () => {
        if (!token) {
            console.error('[Chat] Cannot start connection: User token is missing.');
            return;
        }

        let connectionToStart: signalR.HubConnection | null = connectionRef.current;

        if (connectionToStart &&
            connectionToStart.state !== signalR.HubConnectionState.Disconnected)
        {
            console.warn(`[Chat] Connection already in state: ${connectionToStart.state}. Skipping start attempt.`);
            return;
        }

        if (connectionToStart && connectionToStart.state === signalR.HubConnectionState.Disconnected) {
            console.log('[Chat] Disconnected connection object found. Disposing and rebuilding.');
            connectionToStart = null;
            connectionRef.current = null;
        }

        if (!connectionToStart) {
            console.log('[Chat] Creating new SignalR connection object...');

            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(CHAT_HUB_URL + `?access_token=${encodeURIComponent(token)}`, {skipNegotiation: false})
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: retryContext => {
                        if (retryContext.elapsedMilliseconds < 60000) {
                            return Math.random() * 2000;
                        } else {
                            return null;
                        }
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            setupConnectionHandlers(newConnection);
            connectionToStart = newConnection;
            connectionRef.current = newConnection;
        }

        setState(prev => ({...prev, status: 'connecting', error: null}));

        try {
            await connectionToStart.start();
            setState(prev => ({...prev, status: 'connected', error: null}));
            console.log('SignalR Connected on demand.');
        } catch (err: any) {
            console.error('SignalR connection failed on start: ', err);
            connectionToStart?.off("ReceiveUserStatus");
            connectionToStart?.off("ReceiveMessage");
            connectionToStart?.off("MessagesRead");
            connectionRef.current = null;

            setState(prev => ({
                ...prev,
                status: 'disconnected',
                error: `Connection failed: ${err.message}`,
                connection: null
            }));
        }
    }, [token, setupConnectionHandlers, state.activeChatUser, loadHistory]);

    const stopChatConnection = useCallback(async () => {
        const connection = connectionRef.current;
        if (connection?.state === signalR.HubConnectionState.Connected ||
            connection?.state === signalR.HubConnectionState.Connecting ||
            connection?.state === signalR.HubConnectionState.Reconnecting) {

            connection.off("ReceiveUserStatus");
            connection.off("ReceiveMessage");
            connection.off("ReadMessage");
            connection.off("reconnecting");
            connection.off("reconnected");
            connection.off("close");

            try {
                await connection.stop();
                console.log("Соединение закрыто (вызвано stop())");
            } catch (err) {
                console.error('Error stopping connection:', err);
            }

            connectionRef.current = null;

            setState(prev => ({
                ...prev,
                status: 'disconnected',
                connection: null,
                activeChatUser: null,
                currentChatMessages: [],
            }));

            console.log('SignalR отключено по запросу.');
        }
    }, []);

    const senderId = useMemo(() => userId || 'Me', [userId]);
    const sendMessage = useCallback(async (
        toUserId: string,
        text: string | null,
        files: File[] = []
    ) => {
        const connection = connectionRef.current;
        if (!text && files.length === 0) {
            console.warn("Cannot send empty message without files.");
            return
        }

        console.log(`[Chat Send 1/6] Sending message to: ${toUserId}. Text length: ${text?.length ?? 0}. Files: ${files.length}`);

        if (connection?.state !== signalR.HubConnectionState.Connected) {
            throw new Error('SignalR connection is not established.');
        }

        const filesPromises = files.map(fileToBytes);
        if (files.length > 0) {
            files.forEach(f => {
                console.log(`[Chat Send 2/6] File to process: ${f.name} (${f.type}, ${f.size} bytes)`);
            });
        }
        const filesPayloads = await Promise.all(filesPromises);

        const filesToSendForServer: FileToSend[] = filesPayloads.map(p => ({
            fileName: p.fileName,
            contentType: p.contentType,
            bytes: p.bytes,
        }));

        try {
            await connection.invoke('SendPrivateMessage', toUserId, text, filesToSendForServer);

            console.log(`[Chat Send] Message successfully sent to server.`);

        } catch (err) {
            console.error('[Chat Send ERROR]', err);
            throw err;
        }
    }, [senderId]);

    const leaveChat = useCallback(async () => {
        const connection = connectionRef.current;
        if (connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await connection.invoke('LeaveChat');
                console.log('[Chat] Successfully invoked LeaveChat.');
            } catch (err) {
                console.error('Failed to invoke LeaveChat:', err);
            }
        }
    }, []);

    const setActiveChat = useCallback((userId: string | null) => {
        setState(prev => ({
            ...prev,
            activeChatUser: userId,
            currentChatMessages: [],
            historyPage: 0,
            hasMoreHistory: true,
        }));

        if (userId) {
            loadHistory(userId, 1);
        }
    }, [loadHistory]);

    const contextValue: ChatContextType = {
        state,
        sendMessage,
        loadHistory,
        markAsRead: internalMarkAsRead,
        setActiveChat,
        onlineUsers: state.onlineUsers,
        startChatConnection,
        stopChatConnection,
        leaveChat,
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};