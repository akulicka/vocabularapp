import { vi } from 'vitest'

// Email service mocks
export const createMockEmailService = () => ({
    sendMessage: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
})

// Storage service mocks
export const createMockStorageService = () => ({
    upload_file: vi.fn().mockResolvedValue('uploaded-file-path'),
    download_file: vi.fn().mockResolvedValue([Buffer.from('fake-image-data')]),
})

// Cookie service mocks
export const createMockCookieService = () => ({
    signtoken: vi.fn().mockReturnValue('mock-jwt-token'),
    verifycookie: vi.fn().mockImplementation((req: any, res: any, next: any) => {
        req.query = {
            ...req.query,
            user: {
                userId: 'test-user-id',
                email: 'test@example.com',
                username: 'testuser',
                verified: true,
            },
        }
        next()
    }),
})

// Validation service mocks
export const createMockValidationService = () => ({
    validateBody: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
    validateQuery: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
    validateParams: vi.fn().mockImplementation(() => (req: any, res: any, next: any) => next()),
})

// Token service mocks
export const createMockTokenService = () => ({
    createVerifyToken: vi.fn().mockResolvedValue({
        tokenId: 'test-token-id',
        userId: 'test-user-id',
        tokenClass: 'VERIFY_TOKEN',
    }),
    validateVerifyToken: vi.fn().mockResolvedValue({ response: 'verified' }),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
})

// Auth service mocks
export const createMockAuthService = () => ({
    verifyCredentials: vi.fn().mockResolvedValue({
        verified: true,
        userId: 'test-user-id',
    }),
    authenticateUser: vi.fn().mockResolvedValue({
        userId: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        verified: true,
    }),
    generateToken: vi.fn().mockResolvedValue('mock-jwt-token'),
    registerUser: vi.fn().mockResolvedValue({
        verified: false,
        userId: 'new-user-id',
    }),
})

// Quiz service mocks
export const createMockQuizService = () => ({
    startQuiz: vi.fn().mockResolvedValue({
        quizId: 'test-quiz-id',
        tokenId: 'test-token-id',
        questions: [],
        totalQuestions: 5,
        timeLimit: 300,
    }),
    submitQuiz: vi.fn().mockResolvedValue({
        quizId: 'test-quiz-id',
        userId: 'test-user-id',
        totalQuestions: 5,
        correctAnswers: 4,
        totalTime: 120,
        score: 80,
        completedAt: new Date(),
        wordResults: [],
    }),
    getQuizResult: vi.fn().mockResolvedValue({
        quizId: 'test-quiz-id',
        userId: 'test-user-id',
        totalQuestions: 5,
        correctAnswers: 4,
        totalTime: 120,
        score: 80,
        completedAt: new Date(),
        wordResults: [],
    }),
    getQuizHistory: vi.fn().mockResolvedValue([]),
    cleanupExpiredQuizTokens: vi.fn().mockResolvedValue(undefined),
})

// User service mocks
export const createMockUserService = () => ({
    downloadProfileImage: vi.fn().mockResolvedValue(Buffer.from('fake-image-data')),
    uploadProfileImage: vi.fn().mockResolvedValue('uploaded-file-path'),
    uploadMultipleFiles: vi.fn().mockResolvedValue(['uploaded-file-1', 'uploaded-file-2']),
})

// Default service mocks
export const mockEmailService = createMockEmailService()
export const mockStorageService = createMockStorageService()
export const mockCookieService = createMockCookieService()
export const mockValidationService = createMockValidationService()
export const mockTokenService = createMockTokenService()
export const mockAuthService = createMockAuthService()
export const mockQuizService = createMockQuizService()
export const mockUserService = createMockUserService()
