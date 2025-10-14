export interface TokenUser {
    userId: string
    email: string
    username: string
}

export interface TokenData {
    tokenId: string
    userId: string
    tokenClass: string
    createdAt: Date
    destroy(): Promise<void>
}

export interface CreateVerifyTokenRequest {
    userId: string
}

export interface ValidateVerifyTokenRequest {
    tokenId: string
    userId: string
}

export interface TokenValidationResponse {
    response: 'verified' | 'expired' | 'error'
}

export const VERIFY_TOKEN_CLASS = 'VERIFY' as const
export const QUIZ_TOKEN_CLASS = 'QUIZ' as const
