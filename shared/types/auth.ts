// Shared types for authentication-related DTOs
// Extracted from backend/src/types/auth.ts

export interface AuthenticatedUser {
    userId: string
    email: string
    verified: boolean
}

export interface AuthResponse {
    verified: boolean
    userId: string
}

// Re-export types from schemas (generated from Zod schemas)
export type { LoginRequest, RegisterRequest } from '../schemas/auth'
