import {apiClient} from './apiClient';
import type {AxiosResponse} from "axios";

export interface Interlocutor {
    id: string;
    fullName: string;
    username: string;
}

export interface UserSearchResponse {
    interlocutors: Interlocutor[];
}

export const searchUsersForChatFilter = async (query: string): Promise<UserSearchResponse> => {
    if (!query || query.length < 3) {
        return { interlocutors: [] };
    }

    try {
        const response: AxiosResponse<UserSearchResponse> = await apiClient.get(
            `/admin/user/search`,
            {
                params: {
                    query: query,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Ошибка при поиске пользователей для фильтрации:", error);
        throw error;
    }
};