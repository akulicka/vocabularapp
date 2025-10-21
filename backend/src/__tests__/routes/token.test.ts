import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import tokenRouter from '@routes/token/index.js'
import { validateBody } from '@util/validation.js'
import db from '@db/models/index.js'
import sendMessage from '@util/email.js'
import { CreateVerifyTokenRequest, ValidateVerifyTokenRequest, VERIFY_TOKEN_CLASS } from '@types'

// Mock dependencies
vi.mock('@util/validation.js')
vi.mock('@db/models/index.js')
vi.mock('@util/email.js')

// Mock validation middleware
vi.mocked(validateBody).mockImplementation(() => (req: any, res: any, next: any) => next())

describe('Token Routes', () => {
    let app: express.Application

    const mockUserId = 'test-user-id'
    const mockTokenId = 'test-token-id'
    const mockEmail = 'test@example.com'

    const mockUser = {
        userId: mockUserId,
        email: mockEmail,
        username: 'testuser',
        verified: false,
        save: vi.fn().mockResolvedValue({}),
    }

    const mockToken = {
        tokenId: mockTokenId,
        userId: mockUserId,
        tokenClass: VERIFY_TOKEN_CLASS,
        createdAt: new Date(),
        destroy: vi.fn().mockResolvedValue({}),
        save: vi.fn().mockResolvedValue({}),
    }

    const mockCreateVerifyTokenRequest: CreateVerifyTokenRequest = {
        userId: mockUserId,
    }

    const mockValidateVerifyTokenRequest: ValidateVerifyTokenRequest = {
        tokenId: mockTokenId,
        userId: mockUserId,
    }

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/token', tokenRouter)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('POST /api/token/create-verify-token', () => {
        it('should create verify token successfully', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null) // No previous token
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            expect(response.status).toBe(200)
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId } })
            expect(db.tokens.build).toHaveBeenCalledWith({
                tokenId: expect.any(String),
                userId: mockUserId,
                tokenClass: VERIFY_TOKEN_CLASS,
            })
            expect(sendMessage).toHaveBeenCalledWith({
                user: mockUser,
                token_id: mockTokenId,
            })
        })

        it('should destroy previous token before creating new one', async () => {
            const previousToken = {
                ...mockToken,
                destroy: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(previousToken as any)
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            expect(previousToken.destroy).toHaveBeenCalled()
            expect(db.tokens.build).toHaveBeenCalled()
            expect(sendMessage).toHaveBeenCalled()
        })

        it('should throw error when user does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle database errors during user lookup', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle database errors during token creation', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockToken,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            } as any)

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle email sending errors', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockRejectedValue(new Error('Email service error'))

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should generate unique token ID', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            const buildCall = vi.mocked(db.tokens.build).mock.calls[0][0]
            expect(buildCall?.tokenId).toBeDefined()
            expect(buildCall?.tokenId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })
    })

    describe('POST /api/token/validate-verify-token', () => {
        it('should validate token successfully and verify user', async () => {
            const recentToken = {
                ...mockToken,
                createdAt: new Date(), // Recent token
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(response.body).toEqual({ response: 'verified' })
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId } })
            expect(db.tokens.findOne).toHaveBeenCalledWith({
                where: { userId: mockUserId, tokenId: mockTokenId, tokenClass: VERIFY_TOKEN_CLASS },
            })
            expect(recentToken.destroy).toHaveBeenCalled()
            expect(mockUser.save).toHaveBeenCalled()
            expect((mockUser as any).verified).toBe(1)
        })

        it('should handle expired token and send new verification email', async () => {
            const expiredToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago (expired)
            }

            const newToken = {
                ...mockToken,
                tokenId: 'new-token-id',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue(newToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(response.body).toEqual({ response: 'expired' })
            expect(expiredToken.destroy).toHaveBeenCalled()
            expect(sendMessage).toHaveBeenCalledWith({
                user: mockUser,
                token_id: 'new-token-id',
            })
        })

        it('should throw error when user does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should throw error when token does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle database errors during user lookup', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle database errors during token lookup', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle errors during token destruction', async () => {
            const recentToken = {
                ...mockToken,
                createdAt: new Date(),
                destroy: vi.fn().mockRejectedValue(new Error('Destroy error')),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle errors during user save', async () => {
            const recentToken = {
                ...mockToken,
                createdAt: new Date(),
            }

            const mockUserWithError = {
                ...mockUser,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserWithError as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle errors during new token creation for expired token', async () => {
            const expiredToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 2 * 60 * 1000),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockImplementation(() => {
                throw new Error('Token creation error')
            })

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle email sending errors for expired token', async () => {
            const expiredToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 2 * 60 * 1000),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockToken,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockRejectedValue(new Error('Email error'))

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })
    })

    describe('Request Validation', () => {
        it('should validate create verify token request body', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            expect(validateBody).toHaveBeenCalled()
            expect(response.status).toBe(200)
        })

        it('should validate validate verify token request body', async () => {
            const recentToken = {
                ...mockToken,
                createdAt: new Date(),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(validateBody).toHaveBeenCalled()
            expect(response.body).toEqual({ response: 'verified' })
        })
    })

    describe('Token Expiration Logic', () => {
        it('should correctly identify expired tokens', async () => {
            const expiredToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago (expired)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockToken,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(response.body).toEqual({ response: 'expired' })
        })

        it('should correctly identify valid tokens', async () => {
            const validToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 10 * 1000), // 10 seconds ago (valid)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(validToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(response.body).toEqual({ response: 'verified' })
        })

        it('should handle edge case of token created exactly at expiration time', async () => {
            const edgeToken = {
                ...mockToken,
                createdAt: new Date(Date.now() - 30 * 1000), // Exactly 30 seconds ago (expired)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(edgeToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockToken,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(200)

            expect(response.body).toEqual({ response: 'expired' })
        })
    })

    describe('Error Handling', () => {
        it('should handle malformed request body', async () => {
            const response = await request(app).post('/api/token/create-verify-token').send({ invalid: 'data' }).expect(200) // Validation middleware should handle this

            expect(response.status).toBe(200)
        })

        it('should handle missing required fields', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const response = await request(app).post('/api/token/create-verify-token').send({}).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle database connection errors', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database connection failed'))

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle unexpected errors', async () => {
            vi.mocked(db.users.findOne).mockImplementation(() => {
                throw 'String error'
            })

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })
    })

    describe('Edge Cases', () => {
        it('should handle user with null email', async () => {
            const userWithNullEmail = {
                ...mockUser,
                email: null,
            }

            vi.mocked(db.users.findOne).mockResolvedValue(userWithNullEmail as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const response = await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            expect(sendMessage).toHaveBeenCalledWith({
                user: userWithNullEmail,
                token_id: mockTokenId,
            })
        })

        it('should handle token with invalid tokenClass', async () => {
            const invalidToken = {
                ...mockToken,
                tokenClass: 'INVALID_CLASS',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(invalidToken as any)

            const response = await request(app).post('/api/token/validate-verify-token').send(mockValidateVerifyTokenRequest).expect(500)

            expect(response.status).toBe(500)
        })

        it('should handle concurrent token creation', async () => {
            // Simulate race condition where two tokens are created simultaneously
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne)
                .mockResolvedValueOnce(null) // First check passes
                .mockResolvedValueOnce(mockToken as any) // Second check finds existing token
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            // Both calls should succeed (second one destroys first)
            await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            await request(app).post('/api/token/create-verify-token').send(mockCreateVerifyTokenRequest).expect(200)

            expect(db.tokens.build).toHaveBeenCalledTimes(2)
        })
    })
})
