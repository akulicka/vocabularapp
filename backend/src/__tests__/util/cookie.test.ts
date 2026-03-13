import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { signtoken, verifycookie } from '@util/cookie'
import db from '@db/models/index'
import { createMockInstance } from '../mocks/database.js'

// Mock dependencies
vi.mock('jsonwebtoken')
vi.mock('@db/models/index.js')

describe('Cookie Utility', () => {
    const mockSecretKey = 'witlessyoungfool'
    const mockUserId = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID
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
            vi.mocked(jwt.sign).mockReturnValue(mockToken as any)
            const result = signtoken(mockUserId)

            expect(result).toBe(mockToken)
            expect(jwt.sign).toHaveBeenCalledWith({ userId: mockUserId }, mockSecretKey, { expiresIn: '60m' })
        })
    })

    describe('verifycookie', () => {
        let mockReq: any, mockRes: any, mockNext: any

        beforeEach(() => {
            mockReq = { cookies: {}, query: {} }
            mockRes = { status: vi.fn().mockReturnThis(), send: vi.fn() }
            mockNext = vi.fn()
        })

        it('should verify valid cookie and set user in request', async () => {
            const mockUser = createMockInstance({
                userId: mockUserId,
                email: 'test@example.com',
                verified: true,
            })

            mockReq.cookies.smartposting_token = mockToken
            vi.mocked(jwt.verify).mockReturnValue({ userId: mockUserId } as any)
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            await verifycookie(mockReq, mockRes, mockNext)

            expect(mockReq.query.user).toEqual({ userId: mockUserId, email: 'test@example.com', verified: true })
            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
        })

        it('should handle various error scenarios', async () => {
            // No cookie present
            mockReq.cookies = {}
            await verifycookie(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'no authorization' })

            // Invalid token
            mockReq.cookies.smartposting_token = 'invalid-token'
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token')
            })
            await verifycookie(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'Invalid token' })

            // Invalid userId
            vi.mocked(jwt.verify).mockReturnValue({ userId: 'invalid-uuid' } as any)
            await verifycookie(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'invalid token' })

            // User not found
            vi.mocked(jwt.verify).mockReturnValue({ userId: mockUserId } as any)
            vi.mocked(db.users.findOne).mockResolvedValue(null)
            await verifycookie(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'invalid user' })

            // Database error
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database connection failed'))
            await verifycookie(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'Database connection failed' })
        })
    })
})
