import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import { useAuth } from '../../auth/AuthContext.tsx';
import { showMessageToast } from '@components/notification/NotificationToast';
import { fetchUnreadChatCount } from '@api/chat';
import {markAllNotificationsAsRead} from "@api/chat";

type UserPresence = Record<string, 'online' | 'offline'>;

interface SSEData {
    systemStatus: 'online' | 'degraded' | 'offline';
    globalNotificationCount: number;
    userPresence: UserPresence;
}

interface SSEContextType {
    sseData: SSEData;
    isConnected: boolean;
    resetNotificationCount: () => void;
}

const initialSSEData: SSEData = {
    systemStatus: 'offline',
    globalNotificationCount: 0,
    userPresence: {},
};

const dummyResetNotificationCount = () => {
};

const SSEContext = createContext<SSEContextType>({
    sseData: initialSSEData,
    isConnected: false,
    resetNotificationCount: dummyResetNotificationCount,
});

export const useSSE = () => useContext(SSEContext);

const RECONNECT_INTERVAL = 5000;

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [sseData, setSseData] = useState<SSEData>(initialSSEData);
    const [isConnected, setIsConnected] = useState(false);
    const shouldConnect = useRef(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const isAuthenticated = !!token;

    const disconnectSSE = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        shouldConnect.current = false;
        setIsConnected(false);
    }, []);

    const initializeUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        const count = await fetchUnreadChatCount();

        setSseData(prevData => ({
            ...prevData,
            globalNotificationCount: count,
        }));
    }, [isAuthenticated]);

    const connectSSE = useCallback(async () => {
        if (!isAuthenticated || shouldConnect.current || !token) {
            return;
        }

        shouldConnect.current = true;
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // const sseUrl = 'http://localhost:5211/state';
        const sseUrl = 'https://api.ugolok-repetitora.ru/state'

        try {
            const response = await fetch(sseUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Authorization': `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    disconnectSSE();
                    return;
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setIsConnected(true);

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is not readable.");
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                const events = buffer.split(/\r?\n\r?\n/);
                buffer = events.pop() || '';

                for (const eventString of events) {
                    if (eventString.trim() === '') continue;

                    let eventName = 'message';
                    let payload = '';

                    eventString.split(/\r?\n/).forEach(line => {
                        line = line.trim();
                        if (line.startsWith('event:')) {
                            eventName = line.substring(6).trim();
                        } else if (line.startsWith('data:')) {
                            payload += line.substring(5).trim() + '\n';
                        }
                    });

                    payload = payload.trim();
                    if (!payload) continue;

                    if (eventName === 'initial_presence') {
                        try {
                            const initialPresence = JSON.parse(payload) as UserPresence;

                            setSseData(prevData => ({
                                ...prevData,
                                userPresence: initialPresence,
                            }));
                        } catch (e) {
                        }
                    } else if (eventName === 'presence') {
                        const [userId, status] = payload.split(':');

                        if (userId && (status === 'online' || status === 'offline')) {
                            setSseData(prevData => {
                                // 1. Создаем копию userPresence
                                const newUserPresence = {
                                    ...prevData.userPresence,
                                };

                                newUserPresence[userId] = status;

                                if (status === 'offline') {
                                    delete newUserPresence[userId];
                                }
                                return ({
                                    ...prevData,
                                    userPresence: newUserPresence as UserPresence,
                                });
                            });
                        } else {
                            console.warn('[SSE] Некорректный формат данных presence:', payload);
                        }

                    } else if (eventName === 'newMessage') {
                        showMessageToast(payload);
                        initializeUnreadCount();
                    } else {
                        try {
                            const parsedData = JSON.parse(payload);
                            setSseData(prevData => ({
                                ...prevData,
                                ...parsedData,
                            }));
                        } catch (e) {
                            console.error('[SSE] Ошибка парсинга JSON для события "' + eventName + '":', e, 'Попытка парсинга:', payload);
                        }
                    }
                }
            }

        } catch (error) {
            if (signal.aborted) {
                return;
            }

        } finally {
            setIsConnected(false);

            if (shouldConnect.current) {
                setTimeout(() => {
                    connectSSE();
                }, RECONNECT_INTERVAL);
            }
        }
    }, [isAuthenticated, token, disconnectSSE]);

    const resetNotificationCount = useCallback(async () => {
        setSseData(prevData => {
            if (prevData.globalNotificationCount > 0) {
                return {
                    ...prevData,
                    globalNotificationCount: 0,
                };
            }
            return prevData;
        });

        try {
            await markAllNotificationsAsRead();
        } catch (e) {

            console.error('Не удалось сбросить счетчик на сервере:', e);
        }
    }, []);

    // Эффект для управления жизненным циклом потока
    useEffect(() => {
        if (isAuthenticated) {
            initializeUnreadCount();
            connectSSE();
        } else {
            disconnectSSE();
            setSseData(initialSSEData);
        }

        return () => {
            disconnectSSE();
        };
    }, [isAuthenticated, connectSSE, disconnectSSE, initializeUnreadCount]);


    const contextValue = {
        sseData,
        isConnected,
        resetNotificationCount,
    };

    return (
        <SSEContext.Provider value={contextValue}>
            {children}
        </SSEContext.Provider>
    );
};