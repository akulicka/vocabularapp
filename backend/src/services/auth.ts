import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'
import db from '@db/models/index.js'
import { signtoken } from '@util/cookie.js'
import { LoginRequest, RegisterRequest, AuthResponse } from '@types'
import { UserAttributes } from '@db/models/user'

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<UserAttributes> {
    const user = await db.users.findOne({ where: { email } })
    if (!user) throw new Error('mismatch password or email')

    console.log('🔍 Found user:', user, (user as any).email)

    // Check if password hash exists and is valid
    if (!(user as any).password || (user as any).password.trim() === '') {
        throw new Error('Invalid password hash')
    }

    const match = await argon2.verify((user as any).password, password)
    if (!match) throw new Error('mismatch password or email')

    return user as any
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, username } = data

    // Check if user already exists
    const found = await db.users.findOne({ where: { email } })
    if (found) throw new Error('user already exists')

    // Hash password
    const hash = await argon2.hash(password)

    // Create user
    const user = await db.users.build({
        userId: uuidv4(),
        username,
        password: hash,
        email,
    })

    await user.save()

    const { verified, userId } = user as any

    return {
        verified: verified || process.env.VERIFY_EMAIL === 'false',
        userId,
    }
}

/**
 * Generate JWT token for user
 */
export async function generateToken(userId: string): Promise<string> {
    return signtoken(userId)
}

/**
 * Verify user credentials without generating token
 */
export async function verifyCredentials(email: string, password: string): Promise<AuthResponse> {
    const user = await authenticateUser(email, password)
    const { verified, userId } = user

    return {
        verified: verified || process.env.VERIFY_EMAIL === 'false',
        userId,
    }
}

/**
 * Validate if user exists and is verified
 */
export async function validateUser(userId: string): Promise<boolean> {
    const user = await db.users.findOne({ where: { userId } })
    return !!(user && (user as any).verified)
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserAttributes | null> {
    const user = await db.users.findOne({ where: { email } })
    return user as UserAttributes | null
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserAttributes | null> {
    const user = await db.users.findOne({ where: { userId } })
    return user as UserAttributes | null
}

/**
 * Check if email is already registered
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
    const user = await db.users.findOne({ where: { email } })
    return !!user
}

/**
 * Update user verification status
 */
export async function updateUserVerification(userId: string, verified: boolean): Promise<void> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')
    ;(user as any).verified = verified
    await user.save()
}
