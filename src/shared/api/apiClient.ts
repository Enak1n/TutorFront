import axios, { type InternalAxiosRequestConfig } from 'axios'
import { clearAuthSession, getAuthToken } from '@auth/authStorage'
import { API_V1_URL, API_V2_URL } from '@/shared/config/api'

export const apiClient = axios.create({
	baseURL: API_V1_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const apiClientV2 = axios.create({
	baseURL: API_V2_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

const attachAuthToken = (config: InternalAxiosRequestConfig) => {
	const token = getAuthToken()

	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}

	return config
}

apiClient.interceptors.request.use(
	config => {
		return attachAuthToken(config)
	},
	error => {
		return Promise.reject(error)
	},
)

apiClientV2.interceptors.request.use(
	config => {
		return attachAuthToken(config)
	},
	error => {
		return Promise.reject(error)
	},
)

const handleUnauthorized = (error: unknown) => {
	if (axios.isAxiosError(error) && error.response?.status === 401) {
		clearAuthSession()
	}

	return Promise.reject(error)
}

apiClient.interceptors.response.use(response => response, handleUnauthorized)
apiClientV2.interceptors.response.use(response => response, handleUnauthorized)
