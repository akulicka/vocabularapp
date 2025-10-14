import { z } from 'zod'

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

export interface TokenValidationResponse {
    response: 'verified' | 'expired' | 'error'
}

export const VERIFY_TOKEN_CLASS = 'VERIFY' as const
export const QUIZ_TOKEN_CLASS = 'QUIZ' as const

// Zod schemas for request validation
export const CreateVerifyTokenRequestSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
})

export const ValidateVerifyTokenRequestSchema = z.object({
    tokenId: z.string().uuid('Invalid token ID'),
    userId: z.string().uuid('Invalid user ID'),
})

// Generate types from schemas
export type CreateVerifyTokenRequest = z.infer<typeof CreateVerifyTokenRequestSchema>
export type ValidateVerifyTokenRequest = z.infer<typeof ValidateVerifyTokenRequestSchema>
