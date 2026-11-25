import axios, { type AxiosError } from 'axios'
import { apiClient, apiClientV2 } from './apiClient'
import { getAuthToken } from '@auth/authStorage'

export type AuthRole = 'tutor' | 'student_or_parent'

export interface ApiError {
	success?: false
	error?: string
	message?: string
	errorMessage?: string
}

export interface UserRole {
	id: AuthRole | 'admin' | string
}

export interface UserDetailedInfo {
	id: string
	firstName: string
	lastName: string
	photoUrl: string
	username: string
	email?: string | null
	role: UserRole
}

export interface RegisterRequestV2 {
	email: string
	password: string
	firstName: string
	lastName: string
	role: AuthRole
}

export interface LoginV2Request {
	email: string
	password: string
}

export interface LoginV2Response {
	id: string
	firstName: string
	lastName: string
	email?: string | null
	username: string
	photoUrl: string
	authDate: string
	accessToken: string
	role: AuthRole | 'admin' | string
}

export interface RequestCodeRequest {
	email: string
}

export interface VerifyEmailRequest {
	email: string
	code: string
}

export interface ResetPasswordRequest {
	email: string
	code: string
	password: string
}

export class AuthUnauthorizedError extends Error {
	constructor() {
		super('Auth session is no longer valid')
		this.name = 'AuthUnauthorizedError'
	}
}

const getErrorMessage = (error: unknown, fallback: string): string => {
	const axiosError = error as AxiosError<ApiError>
	return (
		axiosError.response?.data?.message ||
		axiosError.response?.data?.error ||
		axiosError.response?.data?.errorMessage ||
		fallback
	)
}

export const registerV2 = async (data: RegisterRequestV2): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/register', data)
		return response.data
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Ошибка регистрации'))
	}
}

export const loginV2 = async (
	data: LoginV2Request,
): Promise<LoginV2Response> => {
	try {
		const response = await apiClientV2.post<LoginV2Response>('auth/login', data)
		return response.data
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Неверный email или пароль'))
	}
}

export const requestCode = async (email: string): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/request-code', {
			email,
		} as RequestCodeRequest)
		return response.data
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Не удалось отправить код'))
	}
}

export const requestPasswordReset = async (email: string): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/request-password-reset', {
			email,
		} as RequestCodeRequest)
		return response.data
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Не удалось отправить код'))
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
		throw new Error(getErrorMessage(error, 'Неверный код подтверждения'))
	}
}

export const resetPassword = async (
	email: string,
	code: string,
	password: string,
): Promise<void> => {
	try {
		const response = await apiClientV2.post<void>('auth/reset-password', {
			email,
			code,
			password,
		} as ResetPasswordRequest)
		return response.data
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Не удалось изменить пароль'))
	}
}

export const getUserInfo = async (): Promise<UserDetailedInfo | null> => {
	try {
		const token = getAuthToken()
		if (!token) return null
		const { data } = await apiClient.get<UserDetailedInfo>('/auth/me')
		return data
	} catch (error) {
		console.error('[auth] Get user info error:', error)

		if (axios.isAxiosError(error) && error.response?.status === 401) {
			throw new AuthUnauthorizedError()
		}

		throw error
	}
}

export { apiClient }
