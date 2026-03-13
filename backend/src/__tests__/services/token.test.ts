import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createVerifyToken, validateVerifyToken, sendVerificationEmail } from '@services/token.js'
import db from '@db/models/index.js'
import sendMessage from '@util/email.js'
import { TokenData, CreateVerifyTokenRequest, ValidateVerifyTokenRequest, TokenValidationResponse, VERIFY_TOKEN_CLASS, TokenUser } from '@types'
import { createMockInstance } from '../mocks/database.js'

// Mock dependencies
vi.mock('@db/models/index.js')
vi.mock('@util/email.js')

describe('Token Service', () => {
    const mockUserId = 'test-user-id'
    const mockTokenId = 'test-token-id'
    const mockEmail = 'test@example.com'

    const mockUser = createMockInstance({
        userId: mockUserId,
        email: mockEmail,
        username: 'testuser',
        verified: false,
    })

    const mockTokenInstance = createMockInstance({
        tokenId: mockTokenId,
        userId: mockUserId,
        tokenClass: VERIFY_TOKEN_CLASS,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago to ensure not expired
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createVerifyToken', () => {
        it('should create verify token successfully', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)

            const result = await createVerifyToken(mockUserId)

            expect(result).toBeDefined()
            expect(result.tokenId).toBe(mockTokenId)
            expect(result.userId).toBe(mockUserId)
            expect(result.tokenClass).toBe(VERIFY_TOKEN_CLASS)
            expect(db.tokens.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId, tokenClass: VERIFY_TOKEN_CLASS } })
            expect(db.tokens.build).toHaveBeenCalledWith({ tokenId: expect.any(String), userId: mockUserId, tokenClass: VERIFY_TOKEN_CLASS })
            expect(mockTokenInstance.save).toHaveBeenCalled()
        })

        it('should handle various scenarios', async () => {
            // Destroy previous token before creating new one
            const previousToken = { ...mockTokenInstance, destroy: vi.fn().mockResolvedValue({}) }
            vi.mocked(db.tokens.findOne).mockResolvedValue(previousToken as any)
            vi.mocked(db.tokens.build).mockReturnValue(mockTokenInstance as any)
            await createVerifyToken(mockUserId)
            expect(previousToken.destroy).toHaveBeenCalled()

            // Database error during lookup
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))
            await expect(createVerifyToken(mockUserId)).rejects.toThrow('Database error')

            // Database error during save
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            vi.mocked(db.tokens.build).mockReturnValue({ ...mockTokenInstance, save: vi.fn().mockRejectedValue(new Error('Save error')) } as any)
            await expect(createVerifyToken(mockUserId)).rejects.toThrow('Save error')
        })
    })

    describe('validateVerifyToken', () => {
        it('should validate token successfully', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(mockTokenInstance as any)
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            const result = await validateVerifyToken({ tokenId: mockTokenId, userId: mockUserId })

            expect(result).toBeDefined()
            expect(result.response).toBe('verified')
        })

        it('should handle token not found', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            // Just verify the function completes without error
            await expect(validateVerifyToken({ tokenId: mockTokenId, userId: mockUserId })).rejects.toThrow()
        })
    })

    describe('sendVerificationEmail', () => {
        it('should send verification email successfully', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.build).mockReturnValue(createMockInstance({ tokenId: 'new-token-id' }) as any)
            vi.mocked(sendMessage).mockResolvedValue(undefined)

            await sendVerificationEmail(mockUserId)

            expect(sendMessage).toHaveBeenCalledWith({ user: expect.objectContaining({ userId: mockUserId }), token_id: expect.any(String) })
        })

        it('should handle email sending errors', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)
            vi.mocked(db.tokens.build).mockReturnValue(createMockInstance({ tokenId: 'new-token-id' }) as any)
            vi.mocked(sendMessage).mockRejectedValue(new Error('Email sending failed'))

            await expect(sendVerificationEmail(mockUserId)).rejects.toThrow('Email sending failed')
        })
    })
})
