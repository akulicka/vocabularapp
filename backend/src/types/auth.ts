export interface AuthenticatedUser {
    userId: string
    email: string
    verified: boolean
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
    username: string
}

export interface AuthResponse {
    verified: boolean
    userId: string
}
