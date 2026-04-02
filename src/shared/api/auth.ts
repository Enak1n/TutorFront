import { type AxiosError } from "axios"
import type { TelegramUser } from "@components/auth/TelegramLoginButton"
import {apiClient} from './apiClient';

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("authToken")
            localStorage.removeItem("userRole")
            localStorage.removeItem("userData")
        }
        return Promise.reject(error)
    },
)

export interface LoginRequest {
    telegramData: TelegramUser
    role: "tutor" | "student_or_parent"
}

export interface LoginResponse {
    id: string
    accessToken: string
    role: string
}

export interface ApiError {
    success: false
    error: string
    message: string
}

export interface UserRole {
    id: "tutor" | "student_or_parent" | string
}

export interface UserDetailedInfo {
    id: string
    firstName: string
    lastName: string
    photoUrl: string
    username: string
    role: UserRole
    telegramId: number
}

export const loginWithTelegram = async (
    telegramData: TelegramUser,
    role: "tutor" | "student_or_parent" | "admin",
): Promise<LoginResponse> => {
    try {
        const { data } = await apiClient.post<LoginResponse>("/auth/telegram", {
            telegramData,
            role,
        } as LoginRequest)

        return data
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>
        const errorMessage = axiosError.response?.data?.message || "Ошибка авторизации"
        throw new Error(errorMessage)
    }
}

export const getUserInfo = async (): Promise<UserDetailedInfo | null> => {
    try {
        const token = localStorage.getItem("authToken")
        if (!token) return null
        const { data } = await apiClient.get<UserDetailedInfo>("/auth/me")
        return data
    } catch (error) {
        console.error("[v0] Get user info error:", error)
        return null
    }
}

export const logout = async (): Promise<void> => {
    try {
        const token = localStorage.getItem("authToken")
        if (token) {
            await apiClient.post("/auth/logout")
        }
    } catch (error) {
        console.error("[v0] Logout error:", error)
    }
}

export { apiClient }