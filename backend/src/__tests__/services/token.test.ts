import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createVerifyToken, validateVerifyToken, sendVerificationEmail } from '@services/token.js'
import db from '@db/models/index.js'
import sendMessage from '@util/email.js'
import { TokenData, CreateVerifyTokenRequest, ValidateVerifyTokenRequest, TokenValidationResponse, VERIFY_TOKEN_CLASS, TokenUser } from '@types'

// Mock dependencies
vi.mock('@db/models/index.js')
vi.mock('@util/email.js')

describe('Token Service', () => {
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

    const mockToken: TokenData = {
        tokenId: mockTokenId,
        userId: mockUserId,
        tokenClass: VERIFY_TOKEN_CLASS,
        createdAt: new Date(),
    }

    const mockTokenInstance = {
        tokenId: mockTokenId,
        userId: mockUserId,
        tokenClass: VERIFY_TOKEN_CLASS,
        createdAt: new Date(),
        destroy: vi.fn().mockResolvedValue({}),
        save: vi.fn().mockResolvedValue({}),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createVerifyToken', () => {
        it('should create verify token successfully', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null) // No previous token
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)

            const result = await createVerifyToken(mockUserId)

            expect(result).toBeDefined()
            expect(result.tokenId).toBe(mockTokenId)
            expect(result.userId).toBe(mockUserId)
            expect(result.tokenClass).toBe(VERIFY_TOKEN_CLASS)
            expect(db.tokens.findOne).toHaveBeenCalledWith({
                where: { userId: mockUserId, tokenClass: VERIFY_TOKEN_CLASS },
            })
            expect(db.tokens.build).toHaveBeenCalledWith({
                tokenId: expect.any(String),
                userId: mockUserId,
                tokenClass: VERIFY_TOKEN_CLASS,
            })
            expect(mockTokenInstance.save).toHaveBeenCalled()
        })

        it('should destroy previous token before creating new one', async () => {
            const previousToken = {
                ...mockTokenInstance,
                destroy: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.tokens.findOne).mockResolvedValue(previousToken as any)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)

            await createVerifyToken(mockUserId)

            expect(previousToken.destroy).toHaveBeenCalled()
            expect(db.tokens.build).toHaveBeenCalled()
            expect(mockTokenInstance.save).toHaveBeenCalled()
        })

        it('should handle database errors during previous token lookup', async () => {
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))

            await expect(createVerifyToken(mockUserId)).rejects.toThrow('Database error')
        })

        it('should handle database errors during token creation', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockTokenInstance,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            } as any)

            await expect(createVerifyToken(mockUserId)).rejects.toThrow('Save error')
        })

        it('should generate unique token ID', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)

            await createVerifyToken(mockUserId)

            const buildCall = vi.mocked(db.tokens.build).mock.calls[0][0]
            expect(buildCall.tokenId).toBeDefined()
            expect(buildCall.tokenId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })
    })

    describe('validateVerifyToken', () => {
        const mockRequest: ValidateVerifyTokenRequest = {
            tokenId: mockTokenId,
            userId: mockUserId,
        }

        it('should validate token successfully and verify user', async () => {
            const recentToken = {
                ...mockTokenInstance,
                createdAt: new Date(), // Recent token
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            const result = await validateVerifyToken(mockRequest)

            expect(result.response).toBe('verified')
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
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago (expired)
            }

            const newToken = {
                ...mockToken,
                tokenId: 'new-token-id',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockTokenInstance,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const result = await validateVerifyToken(mockRequest)

            expect(result.response).toBe('expired')
            expect(expiredToken.destroy).toHaveBeenCalled()
            expect(sendMessage).toHaveBeenCalledWith({
                user: mockUser,
                token_id: 'new-token-id',
            })
        })

        it('should throw error when user does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('no such user')
        })

        it('should throw error when token does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('no token')
        })

        it('should handle database errors during user lookup', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Database error')
        })

        it('should handle database errors during token lookup', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Database error')
        })

        it('should handle errors during token destruction', async () => {
            const recentToken = {
                ...mockTokenInstance,
                createdAt: new Date(),
                destroy: vi.fn().mockRejectedValue(new Error('Destroy error')),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Destroy error')
        })

        it('should handle errors during user save', async () => {
            const recentToken = {
                ...mockTokenInstance,
                createdAt: new Date(),
            }

            const mockUserWithError = {
                ...mockUser,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserWithError as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(recentToken as any)

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Save error')
        })

        it('should handle errors during new token creation for expired token', async () => {
            const expiredToken = {
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 2 * 60 * 1000),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockImplementation(() => {
                throw new Error('Token creation error')
            })

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Token creation error')
        })

        it('should handle email sending errors for expired token', async () => {
            const expiredToken = {
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 2 * 60 * 1000),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockTokenInstance,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockRejectedValue(new Error('Email error'))

            await expect(validateVerifyToken(mockRequest)).rejects.toThrow('Email error')
        })
    })

    describe('sendVerificationEmail', () => {
        it('should send verification email successfully', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null) // No previous token
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await sendVerificationEmail(mockUserId)

            expect(db.users.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId } })
            expect(sendMessage).toHaveBeenCalledWith({
                user: mockUser,
                token_id: mockTokenId,
            })
        })

        it('should throw error when user does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            await expect(sendVerificationEmail(mockUserId)).rejects.toThrow('no such user')
        })

        it('should handle database errors during user lookup', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Database error'))

            await expect(sendVerificationEmail(mockUserId)).rejects.toThrow('Database error')
        })

        it('should handle token creation errors', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Token lookup error'))

            await expect(sendVerificationEmail(mockUserId)).rejects.toThrow('Token lookup error')
        })

        it('should handle email sending errors', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)
            vi.mocked(sendMessage).mockRejectedValue(new Error('Email service error'))

            await expect(sendVerificationEmail(mockUserId)).rejects.toThrow('Email service error')
        })

        it('should destroy previous token before creating new one', async () => {
            const previousToken = {
                ...mockTokenInstance,
                destroy: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(previousToken as any)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await sendVerificationEmail(mockUserId)

            expect(previousToken.destroy).toHaveBeenCalled()
        })
    })

    describe('Token Expiration Logic', () => {
        it('should correctly identify expired tokens', async () => {
            const expiredToken = {
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago (expired)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(expiredToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockTokenInstance,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const result = await validateVerifyToken({
                tokenId: mockTokenId,
                userId: mockUserId,
            })

            expect(result.response).toBe('expired')
        })

        it('should correctly identify valid tokens', async () => {
            const validToken = {
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 10 * 1000), // 10 seconds ago (valid)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(validToken as any)

            const result = await validateVerifyToken({
                tokenId: mockTokenId,
                userId: mockUserId,
            })

            expect(result.response).toBe('verified')
        })

        it('should handle edge case of token created exactly at expiration time', async () => {
            const edgeToken = {
                ...mockTokenInstance,
                createdAt: new Date(Date.now() - 30 * 1000), // Exactly 30 seconds ago (expired)
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(edgeToken as any)
            vi.mocked(db.tokens.build).mockReturnValue({
                ...mockTokenInstance,
                tokenId: 'new-token-id',
                save: vi.fn().mockResolvedValue({}),
            } as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            const result = await validateVerifyToken({
                tokenId: mockTokenId,
                userId: mockUserId,
            })

            expect(result.response).toBe('expired')
        })
    })

    describe('Edge Cases', () => {
        it('should handle concurrent token creation', async () => {
            // Simulate race condition where two tokens are created simultaneously
            vi.mocked(db.tokens.findOne)
                .mockResolvedValueOnce(null) // First check passes
                .mockResolvedValueOnce(mockTokenInstance) // Second check finds existing token

            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)

            // Both calls should succeed (second one destroys first)
            await createVerifyToken(mockUserId)
            await createVerifyToken(mockUserId)

            expect(db.tokens.build).toHaveBeenCalledTimes(2)
        })

        it('should handle user with null email', async () => {
            const userWithNullEmail = {
                ...mockUser,
                email: null,
            }

            vi.mocked(db.users.findOne).mockResolvedValue(userWithNullEmail as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await sendVerificationEmail(mockUserId)

            expect(sendMessage).toHaveBeenCalledWith({
                user: userWithNullEmail,
                token_id: mockTokenId,
            })
        })

        it('should handle token with invalid tokenClass', async () => {
            const invalidToken = {
                ...mockTokenInstance,
                tokenClass: 'INVALID_CLASS',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(invalidToken as any)

            await expect(
                validateVerifyToken({
                    tokenId: mockTokenId,
                    userId: mockUserId,
                }),
            ).rejects.toThrow('no token')
        })
    })
})
