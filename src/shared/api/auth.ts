import { type AxiosError } from 'axios'
import type { TelegramUser } from '@components/auth/TelegramLoginButton'
import { apiClient, apiClientV2 } from './apiClient'

apiClient.interceptors.response.use(
	response => response,
	(error: AxiosError<ApiError>) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('authToken')
			localStorage.removeItem('userRole')
			localStorage.removeItem('userData')
		}
		return Promise.reject(error)
	},
)

export interface LoginRequest {
	telegramData: TelegramUser
	role: 'tutor' | 'student_or_parent'
}

export interface LoginResponse {
	id: string
	accessToken: string
	role: string
	hasEmailAttached: boolean
	requiresVerification: boolean
}

export interface ApiError {
	success: false
	error: string
	message: string
}

export interface UserRole {
	id: 'tutor' | 'student_or_parent' | string
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

export interface RegisterRequestV2 {
	email: string
	password: string
	firstName: string
	lastName: string
	role: 'tutor' | 'student_or_parent'
}

export interface LoginV2Request {
	email: string
	password: string
}

export interface LoginV2Response {
	id: string
	accessToken: string
	role: string
}

export interface AttachEmailRequest {
	email: string
	password: string
}

export interface RequestCodeRequest {
	email: string
}

export interface VerifyEmailRequest {
	email: string
	code: string
}

export const registerV2 = async (data: RegisterRequestV2): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/register', data)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Ошибка регистрации'
		throw new Error(errorMessage)
	}
}

export const loginV2 = async (
	data: LoginV2Request,
): Promise<LoginV2Response> => {
	try {
		const response = await apiClientV2.post<LoginV2Response>('auth/login', data)

		// 🔹 Сохраняем токены в localStorage
		if (response.data.accessToken) {
			localStorage.setItem('authToken', response.data.accessToken)
		}

		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Неверный email или пароль'
		throw new Error(errorMessage)
	}
}

export const attachEmail = async (
	email: string,
	password: string,
	authToken: string,
): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>(
			'auth/attach-email',
			{ email, password } as AttachEmailRequest,
			{
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			},
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Ошибка привязки email'
		throw new Error(errorMessage)
	}
}

export const requestCode = async (email: string): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/request-code', {
			email,
		} as RequestCodeRequest)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Не удалось отправить код'
		throw new Error(errorMessage)
	}
}

export const verifyEmail = async (
	email: string,
	code: string,
): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/verify-email', {
			email,
			code,
		} as VerifyEmailRequest)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Неверный код подтверждения'
		throw new Error(errorMessage)
	}
}

export const loginWithTelegram = async (
	telegramData: TelegramUser,
	role: 'tutor' | 'student_or_parent' | 'admin',
): Promise<LoginResponse> => {
	try {
		const { data } = await apiClient.post<LoginResponse>('/auth/telegram', {
			telegramData,
			role,
		} as LoginRequest)

		return data
	} catch (error) {
		const axiosError = error as AxiosError<ApiError>
		const errorMessage =
			axiosError.response?.data?.message || 'Ошибка авторизации'
		throw new Error(errorMessage)
	}
}

export const getUserInfo = async (): Promise<UserDetailedInfo | null> => {
	try {
		const token = localStorage.getItem('authToken')
		if (!token) return null
		const { data } = await apiClient.get<UserDetailedInfo>('/auth/me')
		return data
	} catch (error) {
		console.error('[v0] Get user info error:', error)
		return null
	}
}

export const logout = async (): Promise<void> => {
	try {
		const token = localStorage.getItem('authToken')
		if (token) {
			await apiClient.post('/auth/logout')
		}
	} catch (error) {
		console.error('[v0] Logout error:', error)
	}
}

export { apiClient }
