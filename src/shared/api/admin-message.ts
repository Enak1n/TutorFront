import {apiClient} from './apiClient';
import { ChatMessage } from '../chat/chatTypes'
import type { StoredFile } from './files'

export interface UserRole {
    id: 'student_or_parent' | 'tutor' | 'admin' | string;
}

export interface UserInfo {
    firstName: string;
    lastName: string | null;
    photoUrl: string | null;
    username: string | null;
    role: UserRole;
    telegramId: number;
    registeredOn: string;
    id: string;
}

export interface AdminChatPreview {
    chatId: string;
    firstUser: UserInfo;
    secondUser: UserInfo;
}

export interface PaginatedAdminChatsResponse {
    totalCount: number;
    page: number;
    pageSize: number;
    items: AdminChatPreview[];
}

export interface AdminChatHistoryResponse {
    messages: ChatMessage[];
}

export interface GetAdminChatsParams {
    page: number;
    pageSize: number;
    userId?: string;
}

export interface GetAdminChatHistoryParams {
    chatId: string;
    page: number;
    pageSize: number;
}

export interface DeleteChatMessageParams {
    messageId: string;
}



export const fetchAllChatsForAdmin = async (params: GetAdminChatsParams): Promise<PaginatedAdminChatsResponse> => {
    const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
    });

    if (params.userId) {
        queryParams.append('query', params.userId);
    }

    const response = await apiClient.get<PaginatedAdminChatsResponse>(
        `/administration/chat/all?${queryParams}`
    );
    return response.data;
};

export const fetchAdminChatHistory = async (params: GetAdminChatHistoryParams): Promise<AdminChatHistoryResponse> => {
    const queryParams = new URLSearchParams({
        ChatId: params.chatId,
        Page: params.page.toString(),
        PageSize: params.pageSize.toString(),
    }).toString();
    const response = await apiClient.get<AdminChatHistoryResponse>(
        `/administration/chat?${queryParams}`
    );
    return response.data;
};

export const deleteChatMessage = async (params: DeleteChatMessageParams): Promise<void> => {
    const queryParams = new URLSearchParams({
        messageId: params.messageId,
    }).toString();

    await apiClient.delete(
        `/administration/chat?${queryParams}`
    );
};

export interface AdminSendMessageParams {
    chatId: string;
    /** null — от имени администратора, иначе — от имени участника чата. */
    asUserId: string | null;
    text: string | null;
    files?: StoredFile[];
}

export const sendAdminMessage = async (params: AdminSendMessageParams): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>('/administration/chat/message', params);
    return response.data;
};
