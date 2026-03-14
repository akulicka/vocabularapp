import { vi } from 'vitest'
import { UserAttributes } from '@db/models/user'

// Common user identifiers
export const mockUserId = 'test-user-id'
export const mockEmail = 'test@example.com'
export const mockUsername = 'testuser'
export const mockPassword = 'testpassword123'
export const mockHashedPassword = 'hashedpassword123'

// Base user mock
export const createMockUser = (overrides: Partial<UserAttributes> = {}): UserAttributes => ({
    userId: mockUserId,
    username: mockUsername,
    email: mockEmail,
    password: mockHashedPassword,
    profile_image: null,
    verified: true,
    ...overrides,
})

// Common user variations
export const mockUser = createMockUser()
export const mockVerifiedUser = createMockUser({ verified: true })
export const mockUnverifiedUser = createMockUser({ verified: false })
export const mockUserWithImage = createMockUser({ profile_image: 'profile.jpg' })

// User instance with Sequelize methods
export const createMockUserInstance = (overrides: Partial<UserAttributes> = {}) => ({
    ...createMockUser(overrides),
    save: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockImplementation((key: string) => createMockUser(overrides)[key as keyof UserAttributes]),
})

// Request mocks
export const createMockRegisterRequest = (overrides = {}) => ({
    email: mockEmail,
    password: mockPassword,
    username: mockUsername,
    ...overrides,
})

export const createMockLoginRequest = (overrides = {}) => ({
    email: mockEmail,
    password: mockPassword,
    ...overrides,
})
