import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'
import db from '@db/models/index.js'
import { signtoken } from '@util/cookie.js'
import * as tokenService from '@services/token.js'
import { authenticateUser, registerUser } from '@services/auth.js'
import { LoginRequest, RegisterRequest } from '@types'
import { UserAttributes } from '@db/models/user'
import { mockUserId, mockEmail, mockPassword, mockHashedPassword, mockJwtToken, mockUser, createMockUser, createMockRegisterRequest, createMockLoginRequest } from '../mocks/index.js'
import { createMockInstance } from '../mocks/database.js'

// Mock dependencies
vi.mock('@db/models/index.js', () => ({
    default: {
        users: { findOne: vi.fn(), build: vi.fn() },
    },
}))

vi.mock('argon2', () => ({
    default: { hash: vi.fn(), verify: vi.fn() },
}))

vi.mock('@util/cookie.js', () => ({
    signtoken: vi.fn(),
}))

vi.mock('@services/token.js', () => ({
    createVerifyToken: vi.fn(),
    validateVerifyToken: vi.fn(),
    sendVerificationEmail: vi.fn(),
}))

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.VERIFY_EMAIL = 'true' // Set to true so verified should be false by default
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('authenticateUser', () => {
        it('should authenticate user with valid credentials', async () => {
            const mockUserInstance = createMockInstance({ userId: mockUserId, email: mockEmail, password: mockHashedPassword, verified: true })
            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(argon2.verify).mockResolvedValue(true)
            vi.mocked(signtoken).mockReturnValue(mockJwtToken)

            const result = await authenticateUser(mockEmail, mockPassword)

            expect(result).toBeDefined()
            expect(result.userId).toBe(mockUserId)
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } })
            expect(argon2.verify).toHaveBeenCalledWith(mockHashedPassword, mockPassword)
        })

        it('should handle various error scenarios', async () => {
            // User not found
            vi.mocked(db.users.findOne).mockResolvedValue(null)
            await expect(authenticateUser(mockEmail, mockPassword)).rejects.toThrow('mismatch password or email')

            // Invalid password
            const mockUserInstance = createMockInstance({ userId: mockUserId, email: mockEmail, password: mockHashedPassword })
            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(argon2.verify).mockResolvedValue(false)
            await expect(authenticateUser(mockEmail, mockPassword)).rejects.toThrow('mismatch password or email')

            // Database error
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))
            await expect(authenticateUser(mockEmail, mockPassword)).rejects.toThrow('Database error')
        })
    })

    describe('registerUser', () => {
        it('should register user successfully', async () => {
            const mockNewUser = createMockInstance({ verified: false, userId: 'new-user-id' })
            vi.mocked(db.users.findOne).mockResolvedValue(null)
            vi.mocked(argon2.hash).mockResolvedValue(mockHashedPassword)
            vi.mocked(db.users.build).mockReturnValue(mockNewUser as any)

            const result = await registerUser(createMockRegisterRequest())

            expect(result).toBeDefined()
            expect(result.verified).toBe(false)
            expect(result.userId).toBeDefined()
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } })
            expect(argon2.hash).toHaveBeenCalledWith(mockPassword)
            expect(db.users.build).toHaveBeenCalledWith({ userId: expect.any(String), email: mockEmail, password: mockHashedPassword, username: expect.any(String) })
            expect(mockNewUser.save).toHaveBeenCalled()
        })

        it('should handle various error scenarios', async () => {
            // User already exists
            const mockExistingUser = createMockInstance({ userId: mockUserId, email: mockEmail })
            vi.mocked(db.users.findOne).mockResolvedValue(mockExistingUser as any)
            await expect(registerUser(createMockRegisterRequest())).rejects.toThrow('user already exists')

            // Database error during user lookup
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))
            await expect(registerUser(createMockRegisterRequest())).rejects.toThrow('Database error')

            // Password hashing error
            vi.mocked(db.users.findOne).mockResolvedValue(null)
            vi.mocked(argon2.hash).mockRejectedValue(new Error('Hashing error'))
            await expect(registerUser(createMockRegisterRequest())).rejects.toThrow('Hashing error')
        })
    })
})
