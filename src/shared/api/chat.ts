import {apiClient} from './apiClient';

export interface UserRole {
    id: 'tutor' | 'student_or_parent' | 'admin' | string;
}

export interface CompanionInfo {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    photoUrl?: string | null;
    username: string;
    telegramId: number;
    registeredOn: string;
}

export interface ChatPreview {
    chatId: string;
    companion: CompanionInfo;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
    lastMessageSenderId: string | null;
}

export interface MyChatsResponse {
    chats: ChatPreview[];
}

export const fetchMyChats = async (): Promise<ChatPreview[]> => {
    try {
        const response = await apiClient.get<MyChatsResponse>('/chat/my-chats');
        return response.data.chats;
    } catch (error) {
        throw error;
    }
};

export const fetchUnreadChatCount = async (): Promise<number> => {
    try {
        const chats = await fetchMyChats();
        const unreadChatCount = chats.filter(chat => chat.unreadCount > 0).length;

        return unreadChatCount;

    } catch (error) {
        return 0;
    }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    try {
        await apiClient.post('/notification/read');
    } catch (error) {
        throw error;
    }
};