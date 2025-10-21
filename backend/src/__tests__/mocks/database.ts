import { vi } from 'vitest'

// Database mock factory
export const createMockDatabase = () => ({
    users: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        build: vi.fn(),
        create: vi.fn(),
        destroy: vi.fn(),
    },
    tokens: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        build: vi.fn(),
        create: vi.fn(),
        destroy: vi.fn(),
    },
    words: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        build: vi.fn(),
        create: vi.fn(),
        destroy: vi.fn(),
    },
    quizResults: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        build: vi.fn(),
        create: vi.fn(),
        destroy: vi.fn(),
    },
})

// Default database mock
export const mockDatabase = createMockDatabase()

// Transaction mock
export const createMockTransaction = (overrides = {}) => ({
    commit: vi.fn().mockResolvedValue({}),
    rollback: vi.fn().mockResolvedValue({}),
    ...overrides,
})

// Sequelize mock
export const createMockSequelize = (overrides = {}) => ({
    transaction: vi.fn().mockImplementation((callback) => {
        const mockTransaction = createMockTransaction()
        return callback(mockTransaction)
    }),
    ...overrides,
})

// File upload mock
export const createMockFile = (overrides = {}) => ({
    originalname: 'test.jpg',
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    ...overrides,
})

// Multiple files mock
export const createMockFiles = (count = 2) =>
    Array.from({ length: count }, (_, i) =>
        createMockFile({
            originalname: `file${i + 1}.jpg`,
            buffer: Buffer.from(`fake-data-${i + 1}`),
        }),
    )

// Express request mock
export const createMockRequest = (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    file: null,
    files: null,
    ...overrides,
})

// Express response mock
export const createMockResponse = (overrides = {}) => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    ...overrides,
})

// Express next function mock
export const createMockNext = () => vi.fn()

// Middleware mock
export const createMockMiddleware = (implementation?: Function) => vi.fn().mockImplementation(implementation || ((req: any, res: any, next: any) => next()))
