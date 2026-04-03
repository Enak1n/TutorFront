import axios from 'axios'

export const apiClient = axios.create({
	baseURL: 'https://api.ugolok-repetitora.ru/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
})

export const apiClientV2 = axios.create({
	baseURL: 'https://api.ugolok-repetitora.ru/api/v2',
	headers: {
		'Content-Type': 'application/json',
	},
})

apiClient.interceptors.request.use(
	config => {
		const token = localStorage.getItem('authToken')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	error => {
		return Promise.reject(error)
	},
)
