import { HubConnection } from '@microsoft/signalr';

export interface ChatMessage {
    id?: string;
    fromUserId: string;
    toUserId: string;
    text: string | null;
    sentAt: string;
    isRead: boolean;
    files: ChatFile[] | null;
}

export interface ChatFile {
    url?: string;
    fileName: string;
    contentType: string;
    gridFsId: string | null;
}

export interface FileToSend {
    fileName: string;
    contentType: string;
    bytes: string;
}

export interface FileToUploadPayload extends FileToSend {
    dataUrl: string;
}

export interface ChatState {
    connection: HubConnection | null;
    status: 'connected' | 'reconnecting' | 'connecting' | 'disconnected';
    error: string | null;
    currentChatMessages: ChatMessage[];
    activeChatUser: string | null;
    unreadCount: number;
    onlineUsers: Record<string, boolean>;
    historyPage: number;
    hasMoreHistory: boolean;
}

export interface ChatContextType {
    state: ChatState;
    sendMessage: (
        toUserId: string,
        text: string | null,
        files?: File[]
    ) => Promise<void>;
    loadHistory: (withUserId: string, pageNumber?: number, pageSize?: number) => Promise<void>;
    markAsRead: (fromUserId: string) => Promise<void>;
    setActiveChat: (userId: string | null) => void;
    onlineUsers: Record<string, boolean>;
    startChatConnection: () => Promise<void>;
    stopChatConnection: () => Promise<void>;
    leaveChat: () => Promise<void>;
}