import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRouter from '@routes/auth/index.js'
import { verifyCredentials, authenticateUser, generateToken, registerUser } from '@services/auth.js'
import { validateBody } from '@util/validation.js'
import { LoginRequest, RegisterRequest } from '@shared/types'
import { UserAttributes } from '@db/models/user'

// Mock dependencies at module level
vi.mock('@services/auth.js')
vi.mock('@util/validation.js', () => ({
    validateBody: vi.fn((schema: any) => (req: any, res: any, next: any) => {
        next()
    }),
}))

describe('Auth Routes', () => {
    let app: express.Application

    const mockUserId = 'test-user-id'
    const mockEmail = 'test@example.com'
    const mockPassword = 'testpassword123'
    const mockToken = 'mock-jwt-token'

    const mockUser: UserAttributes = {
        userId: mockUserId,
        username: 'testuser',
        email: mockEmail,
        password: 'hashedpassword123',
        profile_image: null,
        verified: true,
    }

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/auth', authRouter)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('POST /api/auth/verify', () => {
        it('should verify user credentials successfully', async () => {
            const mockAuthResponse = {
                verified: true,
                userId: mockUserId,
            }

            vi.mocked(verifyCredentials).mockResolvedValue(mockAuthResponse)

            const response = await request(app)
                .post('/api/auth/verify')
                .send({
                    email: mockEmail,
                    password: mockPassword,
                })
                .expect(200)

            expect(response.body).toEqual(mockAuthResponse)
            expect(verifyCredentials).toHaveBeenCalledWith(mockEmail, mockPassword)
        })

        it('should handle invalid credentials', async () => {
            vi.mocked(verifyCredentials).mockRejectedValue(new Error('mismatch password or email'))

            const response = await request(app)
                .post('/api/auth/verify')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                })
                .expect(500)

            expect(response.text).toBe('mismatch password or email')
        })
    })

    describe('POST /api/auth/login', () => {
        it('should login user successfully and set cookies', async () => {
            vi.mocked(authenticateUser).mockResolvedValue(mockUser as any)
            vi.mocked(generateToken).mockResolvedValue(mockToken)

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: mockEmail,
                    password: mockPassword,
                })
                .expect(200)

            expect(response.headers['set-cookie']).toBeDefined()
            expect(authenticateUser).toHaveBeenCalledWith(mockEmail, mockPassword)
            expect(generateToken).toHaveBeenCalledWith(mockUserId)
        })

        it('should handle login with invalid credentials', async () => {
            vi.mocked(authenticateUser).mockRejectedValue(new Error('mismatch password or email'))

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                })
                .expect(500)

            expect(response.text).toBe('mismatch password or email')
        })
    })

    describe('POST /api/auth/logout', () => {
        it('should logout user successfully', async () => {
            const response = await request(app).post('/api/auth/logout').expect(200)

            expect(response.status).toBe(200)
        })

        it('should clear authentication cookies', async () => {
            const response = await request(app).post('/api/auth/logout').expect(200)

            const cookies = response.headers['set-cookie']
            expect(cookies).toBeDefined()
            expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining('smartposting_token'), expect.stringContaining('smartposting_session')]))
        })
    })

    describe('POST /api/auth/register', () => {
        it('should register new user successfully', async () => {
            const registerData: RegisterRequest = {
                email: 'newuser@example.com',
                password: 'newpassword123',
                username: 'newuser',
            }

            const mockAuthResponse = {
                verified: false,
                userId: 'new-user-id',
            }

            vi.mocked(registerUser).mockResolvedValue(mockAuthResponse)

            const response = await request(app).post('/api/auth/register').send(registerData).expect(200)

            expect(response.body).toEqual(mockAuthResponse)
            expect(registerUser).toHaveBeenCalledWith(registerData)
        })

        it('should reject registration with existing email', async () => {
            const registerData: RegisterRequest = {
                email: mockEmail,
                password: 'newpassword123',
                username: 'newuser',
            }

            vi.mocked(registerUser).mockRejectedValue(new Error('user already exists'))

            const response = await request(app).post('/api/auth/register').send(registerData).expect(500)

            expect(response.text).toBe('user already exists')
        })
    })

    describe('Service Integration', () => {
        it('should call auth service methods correctly', async () => {
            const loginData = {
                email: mockEmail,
                password: mockPassword,
            }

            vi.mocked(authenticateUser).mockResolvedValue(mockUser as any)
            vi.mocked(generateToken).mockResolvedValue(mockToken)

            await request(app).post('/api/auth/login').send(loginData).expect(200)

            expect(authenticateUser).toHaveBeenCalledWith(loginData.email, loginData.password)
            expect(generateToken).toHaveBeenCalledWith(mockUser.userId)
        })

        it('should handle service errors properly', async () => {
            vi.mocked(authenticateUser).mockRejectedValue(new Error('Service error'))

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: mockEmail,
                    password: mockPassword,
                })
                .expect(500)

            expect(response.text).toBe('Service error')
        })
    })
})
