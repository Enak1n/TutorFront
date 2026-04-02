import { UserDetailedInfo } from "./auth";
import {apiClient} from './apiClient';

export interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    roleId?: "tutor" | "student_or_parent" | "admin";
}

export const getUserProfile = async (userId: string): Promise<UserDetailedInfo> => {
    try {
        const { data } = await apiClient.get<UserDetailedInfo>("/user/profile", {
            params: {
                id: userId
            }
        });
        return data;
    } catch (error) {
        console.error(`[API] Failed to fetch profile for ID ${userId}:`, error);
        throw new Error("Не удалось загрузить профиль пользователя.");
    }
};

export const updateUserProfile = async (userId: string, data: UserUpdateData): Promise<UserDetailedInfo> => {
    const payload: {
        userId: string;
        role?: string;
        firstName?: string;
        lastName?: string;
    } = {
        userId: userId,
    };

    if (data.roleId) {
        payload.role = data.roleId;
    }
    if (data.firstName) {
        payload.firstName = data.firstName;
    }
    if (data.lastName) {
        payload.lastName = data.lastName;
    }
    try {
        const { data: updatedUser } = await apiClient.put<UserDetailedInfo>("/admin/user/edit", payload);
        return updatedUser;
    } catch (error) {
        throw new Error("Не удалось обновить данные пользователя.");
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        await apiClient.delete("/admin/user/delete", {
            params: {
                id: userId
            }
        });
    } catch (error) {
        throw new Error("Не удалось удалить пользователя.");
    }
};

