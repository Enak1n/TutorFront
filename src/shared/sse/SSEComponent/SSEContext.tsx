import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.tsx';
import { showMessageToast } from '@components/notification/NotificationToast';
import { fetchUnreadChatCount, markAllNotificationsAsRead } from '@api/chat';
import { SSE_URL } from '@/shared/config/api';
import { startSseClient, type SseEvent } from '../sseClient';

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

const SSEContext = createContext<SSEContextType>({
    sseData: initialSSEData,
    isConnected: false,
    resetNotificationCount: () => {},
});

export const useSSE = () => useContext(SSEContext);

/** GUID-ы с бэка и фронта могут отличаться регистром — нормализуем ключи. */
const normalizeId = (id: string) => id.trim().toLowerCase();

/** Онлайн ли пользователь (регистр GUID не важен). */
export const isUserOnline = (presence: UserPresence, userId: string | null | undefined): boolean =>
    !!userId && presence[normalizeId(userId)] === 'online';

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [sseData, setSseData] = useState<SSEData>(initialSSEData);
    const [isConnected, setIsConnected] = useState(false);

    const refreshUnreadCount = useCallback(async () => {
        const count = await fetchUnreadChatCount();
        setSseData(prev => ({ ...prev, globalNotificationCount: count }));
    }, []);

    // Держим в ref, чтобы подключение не пересоздавалось при каждом рендере.
    const refreshUnreadCountRef = useRef(refreshUnreadCount);
    refreshUnreadCountRef.current = refreshUnreadCount;

    const handleEvent = useCallback((event: SseEvent) => {
        switch (event.name) {
            case 'initial_presence': {
                try {
                    const raw = JSON.parse(event.data) as UserPresence;
                    const userPresence: UserPresence = {};
                    Object.keys(raw).forEach(id => {
                        userPresence[normalizeId(id)] = 'online';
                    });
                    setSseData(prev => ({ ...prev, userPresence }));
                } catch (e) {
                    console.error('[SSE] Некорректный initial_presence:', e);
                }
                break;
            }

            case 'presence': {
                const separatorIndex = event.data.lastIndexOf(':');
                const userId = normalizeId(event.data.slice(0, separatorIndex));
                const status = event.data.slice(separatorIndex + 1);

                if (!userId || (status !== 'online' && status !== 'offline')) {
                    console.warn('[SSE] Некорректный формат presence:', event.data);
                    break;
                }

                setSseData(prev => {
                    const userPresence = { ...prev.userPresence };
                    if (status === 'online') userPresence[userId] = 'online';
                    else delete userPresence[userId];
                    return { ...prev, userPresence };
                });
                break;
            }

            case 'newMessage':
                showMessageToast(event.data);
                refreshUnreadCountRef.current().catch(() => undefined);
                break;

            // Уведомления о занятиях и домашних заданиях (текст уже готов на сервере).
            case 'notification':
                showMessageToast(event.data);
                window.dispatchEvent(new CustomEvent('app:notification', { detail: event.data }));
                break;

            default:
                try {
                    const parsed = JSON.parse(event.data);
                    setSseData(prev => ({ ...prev, ...parsed }));
                } catch {
                    // Неизвестное событие не в JSON — игнорируем.
                }
        }
    }, []);

    useEffect(() => {
        if (!token) {
            setSseData(initialSSEData);
            setIsConnected(false);
            return;
        }

        refreshUnreadCountRef.current().catch(() => undefined);

        const stop = startSseClient({
            url: SSE_URL,
            token,
            onEvent: handleEvent,
            onStatusChange: status => {
                const connected = status === 'connected';
                setIsConnected(connected);
                setSseData(prev => ({ ...prev, systemStatus: connected ? 'online' : 'offline' }));
            },
        });

        return stop;
    }, [token, handleEvent]);

    const resetNotificationCount = useCallback(async () => {
        setSseData(prev => (prev.globalNotificationCount > 0 ? { ...prev, globalNotificationCount: 0 } : prev));

        try {
            await markAllNotificationsAsRead();
        } catch (e) {
            console.error('Не удалось сбросить счетчик на сервере:', e);
        }
    }, []);

    return (
        <SSEContext.Provider value={{ sseData, isConnected, resetNotificationCount }}>
            {children}
        </SSEContext.Provider>
    );
};
