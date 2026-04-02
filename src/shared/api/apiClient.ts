import axios from "axios"

export const apiClient = axios.create({
    baseURL: "https://api.ugolok-repetitora.ru/api/v1",
    // baseURL: "http://localhost:5211/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
})

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)