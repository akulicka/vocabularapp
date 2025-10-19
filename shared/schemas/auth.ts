// Shared Zod schemas for authentication request validation
import { z } from 'zod'

// Zod schemas for request validation
export const LoginRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
})

export const RegisterRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
})

// Generate types from schemas
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

