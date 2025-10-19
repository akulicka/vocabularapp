import { AxiosRequestConfig } from 'axios'
import request from './request'

// API Response types
export interface ApiResponse<T = any> {
    data: T
    message?: string
    success?: boolean
}

export interface ApiError {
    message: string
    error?: string
    details?: any[]
}

// HTTP Method type signatures
export type GetMethod = <T>(url: string, config?: AxiosRequestConfig) => Promise<T>

export type PostMethod = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>

export type PutMethod = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>

export type DeleteMethod = <T>(url: string, config?: AxiosRequestConfig) => Promise<T>

// API interface combining all methods
export interface ApiClient {
    get: GetMethod
    post: PostMethod
    put: PutMethod
    delete: DeleteMethod
}

// Type-safe wrapper functions
export const api: ApiClient = {
    get: async (url, config) => (await request.get(url, config)).data,
    post: async (url, data, config) => (await request.post(url, data, config)).data,
    put: async (url, data, config) => (await request.put(url, data, config)).data,
    delete: async (url, config) => (await request.delete(url, config)).data,
}
