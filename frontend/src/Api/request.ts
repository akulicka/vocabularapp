import Axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { ApiError } from './types'

// Extend ImportMeta interface for Vite environment variables
declare global {
    interface ImportMeta {
        env: {
            DEV: boolean
            VITE_API_BASE_URL: string
        }
    }
}

const baseURL = import.meta.env.DEV ? 'http://localhost:3000/' : import.meta.env.VITE_API_BASE_URL

const request: AxiosInstance = Axios.create({
    baseURL,
    timeout: 1000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

// Request interceptor for logging (optional)
request.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
        return config
    },
    (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
    },
)

// Response interceptor for error handling
request.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message)

        // Transform error to consistent format
        const apiError: ApiError = {
            message: (error.response?.data as any)?.error || error.message || 'An unexpected error occurred',
            error: (error.response?.data as any)?.error,
            details: (error.response?.data as any)?.details,
        }

        return Promise.reject(apiError)
    },
)

export default request
