import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import jwt, { Jwt } from 'jsonwebtoken'
import { signtoken, verifycookie } from '@util/cookie'
import db from '@db/models/index'

// Mock dependencies
vi.mock('jsonwebtoken')
vi.mock('@db/models/index.js')

describe('Cookie Utility', () => {
    const mockSecretKey = 'test-secret-key'
    const mockUserId = 'test-user-id'
    const mockToken = 'mock-jwt-token'

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.TOKEN_SECRET = mockSecretKey
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('signtoken', () => {
        it('should sign a token with userId', () => {
            vi.mocked(jwt.sign).mockReturnValue(mockToken)

            const result = signtoken(mockUserId)

            expect(result).toBe(mockToken)
            expect(jwt.sign).toHaveBeenCalledWith({ userId: mockUserId }, mockSecretKey, { expiresIn: '60m' })
        })
    })

    describe('verifycookie', () => {
        let mockReq: any
        let mockRes: any
        let mockNext: any

        beforeEach(() => {
            mockReq = {
                cookies: {},
                query: {},
            }
            mockRes = {
                status: vi.fn().mockReturnThis(),
                send: vi.fn(),
            }
            mockNext = vi.fn()
        })

        it('should verify valid cookie and set user in request', async () => {
            const mockUser = {
                get: vi.fn().mockImplementation((field: string) => {
                    const userData = {
                        userId: mockUserId,
                        email: 'test@example.com',
                        verified: true,
                    }
                    return userData[field as keyof typeof userData]
                }),
            }

            mockReq.cookies.smartposting_token = mockToken

            vi.mocked(jwt.verify).mockImplementation(() => ({ userId: mockUserId }))
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser)

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockReq.query.user).toEqual({
                userId: mockUserId,
                email: 'test@example.com',
                verified: true,
            })
            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
        })

        it('should return 403 when no cookie present', async () => {
            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'no authorization' })
            expect(mockNext).not.toHaveBeenCalled()
        })

        it('should return 403 when token is invalid', async () => {
            mockReq.cookies.smartposting_token = 'invalid-token'
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token')
            })

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'Invalid token' })
            expect(mockNext).not.toHaveBeenCalled()
        })

        it('should return 403 when userId is invalid', async () => {
            mockReq.cookies.smartposting_token = mockToken
            vi.mocked(jwt.verify).mockReturnValue({ userId: 'invalid-uuid' })

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'invalid token' })
            expect(mockNext).not.toHaveBeenCalled()
        })

        it('should return 403 when user not found in database', async () => {
            mockReq.cookies.smartposting_token = mockToken
            vi.mocked(jwt.verify).mockReturnValue({ userId: mockUserId })
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'invalid user' })
            expect(mockNext).not.toHaveBeenCalled()
        })

        it('should handle database errors', async () => {
            mockReq.cookies.smartposting_token = mockToken
            vi.mocked(jwt.verify).mockReturnValue({ userId: mockUserId })
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database connection failed'))

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'Database connection failed' })
            expect(mockNext).not.toHaveBeenCalled()
        })
    })
})
