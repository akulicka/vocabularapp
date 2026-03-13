import { vi } from 'vitest'

// Consolidated service mocks
export const createMockEmailService = () => ({
    sendMessage: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
})

export const createMockStorageService = () => ({
    upload_file: vi.fn().mockResolvedValue('uploaded-file-path'),
    download_file: vi.fn().mockResolvedValue([Buffer.from('fake-image-data')]),
})

export const createMockCookieService = () => ({
    signtoken: vi.fn().mockReturnValue('mock-jwt-token'),
    verifycookie: vi.fn().mockImplementation((req: any, res: any, next: any) => {
        req.query = { ...req.query, user: { userId: 'test-user-id', email: 'test@example.com', username: 'testuser', verified: true } }
        next()
    }),
})

export const createMockTransactionService = () => ({
    withTransaction: vi.fn().mockImplementation((callback: any) => callback()),
})

export const createMockValidationService = () => ({
    validateBody: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
    validateQuery: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
    validateParams: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
    validateData: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
})

// Default mock implementations
export const defaultMocks = {
    email: createMockEmailService(),
    storage: createMockStorageService(),
    cookie: createMockCookieService(),
    transaction: createMockTransactionService(),
    validation: createMockValidationService(),
}
