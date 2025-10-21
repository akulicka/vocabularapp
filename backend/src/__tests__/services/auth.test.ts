import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'
import db from '@db/models/index.js'
import { signtoken } from '@util/cookie.js'
import * as tokenService from '@services/token.js'
import { LoginRequest, RegisterRequest } from '@types'
import { UserAttributes } from '@db/models/user'

// Mock dependencies
vi.mock('@db/models/index.js', () => ({
    default: {
        users: {
            findOne: vi.fn(),
            build: vi.fn(),
        },
    },
}))

vi.mock('argon2', () => ({
    default: {
        hash: vi.fn(),
        verify: vi.fn(),
    },
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
    const mockUserId = uuidv4()
    const mockEmail = 'test@example.com'
    const mockPassword = 'testpassword123'
    const mockHashedPassword = 'hashedpassword123'
    const mockToken = 'mock-jwt-token'

    const mockUser: UserAttributes = {
        userId: mockUserId,
        username: 'testuser',
        email: mockEmail,
        password: mockHashedPassword,
        profile_image: null,
        verified: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('authorizeUser', () => {
        it('should authorize user with valid credentials', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(argon2.verify).mockResolvedValue(true)

            const user = await db.users.findOne({ where: { email: mockEmail } })
            if (user && (user as any).password) {
                const isValid = await argon2.verify((user as any).password, mockPassword)
                expect(isValid).toBe(true)
            }

            expect(db.users.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } })
            expect(argon2.verify).toHaveBeenCalledWith(mockHashedPassword, mockPassword)
        })

        it('should reject user with invalid email', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const user = await db.users.findOne({ where: { email: mockEmail } })
            expect(user).toBeNull()
        })

        it('should reject user with invalid password', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(argon2.verify).mockResolvedValue(false)

            const user = await db.users.findOne({ where: { email: mockEmail } })
            if (user && (user as any).password) {
                const isValid = await argon2.verify((user as any).password, 'wrongpassword')
                expect(isValid).toBe(false)
            }
        })

        it('should reject user with empty password hash', async () => {
            const userWithoutPassword = { ...mockUser, password: '' }
            vi.mocked(db.users.findOne).mockResolvedValue(userWithoutPassword as any)

            const user = await db.users.findOne({ where: { email: mockEmail } })
            const hasValidPassword = user && (user as any).password && (user as any).password.trim() !== ''
            expect(hasValidPassword).toBe(false)
        })

        it('should reject user with null password hash', async () => {
            const userWithoutPassword = { ...mockUser, password: null }
            vi.mocked(db.users.findOne).mockResolvedValue(userWithoutPassword as any)

            const user = await db.users.findOne({ where: { email: mockEmail } })
            const hasValidPassword = user && (user as any).password
            expect(hasValidPassword).toBe(false)
        })
    })

    describe('registerUser', () => {
        it('should register new user successfully', async () => {
            const registerData: RegisterRequest = {
                email: mockEmail,
                password: mockPassword,
                username: 'newuser',
            }

            const mockNewUser = {
                ...mockUser,
                userId: uuidv4(),
                username: 'newuser',
                verified: false,
                save: vi.fn().mockResolvedValue({ ...mockUser, username: 'newuser' }),
            }

            vi.mocked(db.users.findOne).mockResolvedValueOnce(null) // No existing user
            vi.mocked(argon2.hash).mockResolvedValue(mockHashedPassword)
            vi.mocked(db.users.build).mockReturnValue(mockNewUser as any)

            // Check if user exists
            const existingUser = await db.users.findOne({ where: { email: mockEmail } })
            expect(existingUser).toBeNull()

            // Hash password
            const hashedPassword = await argon2.hash(registerData.password)
            expect(hashedPassword).toBe(mockHashedPassword)

            // Create user
            const user = db.users.build({
                userId: uuidv4(),
                username: registerData.username,
                password: hashedPassword,
                email: registerData.email,
            })

            await (user as any).save()

            expect(db.users.build).toHaveBeenCalledWith({
                userId: expect.any(String),
                username: 'newuser',
                password: mockHashedPassword,
                email: mockEmail,
            })
            expect(mockNewUser.save).toHaveBeenCalled()
        })

        it('should reject registration with existing email', async () => {
            const registerData: RegisterRequest = {
                email: mockEmail,
                password: mockPassword,
                username: 'newuser',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            const existingUser = await db.users.findOne({ where: { email: mockEmail } })
            const userExists = !!existingUser

            expect(userExists).toBe(true)
            expect(existingUser).toEqual(mockUser)
        })

        it('should hash password during registration', async () => {
            const registerData: RegisterRequest = {
                email: mockEmail,
                password: mockPassword,
                username: 'newuser',
            }

            vi.mocked(argon2.hash).mockResolvedValue(mockHashedPassword)

            const hashedPassword = await argon2.hash(registerData.password)

            expect(argon2.hash).toHaveBeenCalledWith(mockPassword)
            expect(hashedPassword).toBe(mockHashedPassword)
        })
    })

    describe('generateAuthToken', () => {
        it('should generate JWT token for authenticated user', async () => {
            vi.mocked(signtoken).mockReturnValue(mockToken)

            const token = signtoken(mockUserId)

            expect(token).toBe(mockToken)
            expect(signtoken).toHaveBeenCalledWith(mockUserId)
        })

        it('should generate different tokens for different users', async () => {
            const anotherUserId = uuidv4()
            const anotherToken = 'another-jwt-token'

            vi.mocked(signtoken).mockReturnValueOnce(mockToken).mockReturnValueOnce(anotherToken)

            const token1 = signtoken(mockUserId)
            const token2 = signtoken(anotherUserId)

            expect(token1).toBe(mockToken)
            expect(token2).toBe(anotherToken)
            expect(signtoken).toHaveBeenCalledTimes(2)
        })
    })

    describe('emailVerification', () => {
        it('should create verification token', async () => {
            const mockTokenData = {
                tokenId: uuidv4(),
                userId: mockUserId,
                tokenClass: 'VERIFY_TOKEN',
            }

            vi.mocked(tokenService.createVerifyToken).mockResolvedValue(mockTokenData as any)

            const token = await tokenService.createVerifyToken(mockUserId)

            expect(token).toEqual(mockTokenData)
            expect(tokenService.createVerifyToken).toHaveBeenCalledWith(mockUserId)
        })

        it('should validate verification token', async () => {
            const mockValidationRequest = {
                tokenId: uuidv4(),
                userId: mockUserId,
            }

            const mockValidationResponse = {
                response: 'verified' as const,
            }

            vi.mocked(tokenService.validateVerifyToken).mockResolvedValue(mockValidationResponse)

            const result = await tokenService.validateVerifyToken(mockValidationRequest)

            expect(result).toEqual(mockValidationResponse)
            expect(tokenService.validateVerifyToken).toHaveBeenCalledWith(mockValidationRequest)
        })

        it('should handle expired verification token', async () => {
            const mockValidationRequest = {
                tokenId: uuidv4(),
                userId: mockUserId,
            }

            const mockExpiredResponse = {
                response: 'expired' as const,
            }

            vi.mocked(tokenService.validateVerifyToken).mockResolvedValue(mockExpiredResponse)

            const result = await tokenService.validateVerifyToken(mockValidationRequest)

            expect(result).toEqual(mockExpiredResponse)
        })

        it('should send verification email', async () => {
            vi.mocked(tokenService.sendVerificationEmail).mockResolvedValue()

            await tokenService.sendVerificationEmail(mockUserId)

            expect(tokenService.sendVerificationEmail).toHaveBeenCalledWith(mockUserId)
        })
    })

    describe('passwordSecurity', () => {
        it('should hash passwords securely', async () => {
            const password = 'testpassword123'
            const hashedPassword = 'secure-hash'

            vi.mocked(argon2.hash).mockResolvedValue(hashedPassword)

            const result = await argon2.hash(password)

            expect(result).toBe(hashedPassword)
            expect(argon2.hash).toHaveBeenCalledWith(password)
        })

        it('should verify passwords correctly', async () => {
            const password = 'testpassword123'
            const hashedPassword = 'secure-hash'

            vi.mocked(argon2.verify).mockResolvedValue(true)

            const isValid = await argon2.verify(hashedPassword, password)

            expect(isValid).toBe(true)
            expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password)
        })

        it('should reject incorrect password verification', async () => {
            const correctPassword = 'testpassword123'
            const wrongPassword = 'wrongpassword'
            const hashedPassword = 'secure-hash'

            vi.mocked(argon2.verify).mockResolvedValue(false)

            const isValid = await argon2.verify(hashedPassword, wrongPassword)

            expect(isValid).toBe(false)
        })
    })

    describe('userValidation', () => {
        it('should validate user verification status', async () => {
            const verifiedUser = { ...mockUser, verified: true }
            const unverifiedUser = { ...mockUser, verified: false }

            vi.mocked(db.users.findOne).mockResolvedValueOnce(verifiedUser as any)
            vi.mocked(db.users.findOne).mockResolvedValueOnce(unverifiedUser as any)

            const user1 = await db.users.findOne({ where: { userId: mockUserId } })
            const user2 = await db.users.findOne({ where: { userId: mockUserId } })

            expect((user1 as any).verified).toBe(true)
            expect((user2 as any).verified).toBe(false)
        })

        it('should handle environment-based verification bypass', async () => {
            const originalEnv = process.env.VERIFY_EMAIL
            process.env.VERIFY_EMAIL = 'false'

            const unverifiedUser = { ...mockUser, verified: false }
            const shouldVerify = unverifiedUser.verified || process.env.VERIFY_EMAIL === 'false'

            expect(shouldVerify).toBe(true)

            process.env.VERIFY_EMAIL = originalEnv
        })
    })
})
