import {apiClient} from './apiClient';
import { UserFilters } from '@components/ui/Input/FilterUser';

export interface UserListUser {
    id: string;
    firstName: string;
    lastName: string | null;
    photoUrl: string;
    username: string;
    role: { id: string };
    telegramId: number;
    registeredOn: string;
}

export interface AllUsersResponse {
    totalCount: number;
    page: number;
    pageSize: number;
    users: UserListUser[];
}

export const getAllUsers = async (
    page: number,
    pageSize: number,
    filters: UserFilters
): Promise<AllUsersResponse> => {

    const params = {
        ...filters,
        page,
        pageSize,
    };

    const response = await apiClient.get<AllUsersResponse>(`/admin/user/all-users`, {
        params: params,
    });

    return response.data;
};