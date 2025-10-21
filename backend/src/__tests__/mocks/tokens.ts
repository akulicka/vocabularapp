import { vi } from 'vitest'
import { VERIFY_TOKEN_CLASS, QUIZ_TOKEN_CLASS } from '@types'

// Common token identifiers
export const mockTokenId = 'test-token-id'
export const mockJwtToken = 'mock-jwt-token'
export const mockSecretKey = 'test-secret-key'

// Base token mock
export const createMockToken = (overrides = {}) => ({
    tokenId: mockTokenId,
    userId: 'test-user-id',
    tokenClass: VERIFY_TOKEN_CLASS,
    createdAt: new Date(),
    payload: null,
    save: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn().mockReturnValue({}),
    validate: vi.fn().mockResolvedValue(true),
    ...overrides,
})

// Common token variations
export const mockVerifyToken = createMockToken({ tokenClass: VERIFY_TOKEN_CLASS })
export const mockQuizToken = createMockToken({ tokenClass: QUIZ_TOKEN_CLASS })

// Token with payload (for quiz tokens)
export const createMockTokenWithPayload = (payload: any, overrides = {}) => ({
    ...createMockToken(overrides),
    payload,
})

// Verification token request
export const createMockVerifyTokenRequest = (overrides = {}) => ({
    userId: 'test-user-id',
    ...overrides,
})

// Verification token validation request
export const createMockValidateTokenRequest = (overrides = {}) => ({
    tokenId: mockTokenId,
    userId: 'test-user-id',
    ...overrides,
})

// Token validation responses
export const mockTokenValidationResponses = {
    verified: { response: 'verified' as const },
    expired: { response: 'expired' as const },
    invalid: { response: 'invalid' as const },
}
