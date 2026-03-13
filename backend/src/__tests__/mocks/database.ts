import { vi } from 'vitest'

// Common database model methods
const createModelMethods = () => ({
    findOne: vi.fn(),
    findAll: vi.fn(),
    build: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
    findAndCountAll: vi.fn(),
})

// Sequelize instance methods for model instances
const createInstanceMethods = () => ({
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    reload: vi.fn().mockResolvedValue({}),
    toJSON: vi.fn().mockReturnValue({}),
    validate: vi.fn().mockResolvedValue(true),
    // Word-specific methods
    getNoun: vi.fn().mockResolvedValue(null),
    getVerb: vi.fn().mockResolvedValue(null),
    getTags: vi.fn().mockResolvedValue([]),
    createNoun: vi.fn().mockResolvedValue({}),
    createVerb: vi.fn().mockResolvedValue({}),
    createTag: vi.fn().mockResolvedValue({}),
})

// Database mock factory
export const createMockDatabase = () => ({
    users: createModelMethods(),
    tokens: createModelMethods(),
    words: createModelMethods(),
    quizResults: createModelMethods(),
    tags: createModelMethods(),
    sequelize: {
        transaction: vi.fn().mockResolvedValue({
            commit: vi.fn().mockResolvedValue({}),
            rollback: vi.fn().mockResolvedValue({}),
        }),
    },
})

// Default database mock
export const defaultDatabaseMock = createMockDatabase()

// Helper to create mock instances with proper methods
export const createMockInstance = (data: any = {}) => {
    const instance = {
        ...data,
        get: vi.fn().mockImplementation((key?: string) => {
            if (key) {
                return data[key]
            }
            return data
        }),
        set: vi.fn(),
        save: vi.fn().mockResolvedValue({}),
        destroy: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        reload: vi.fn().mockResolvedValue({}),
        toJSON: vi.fn().mockReturnValue({}),
        validate: vi.fn().mockResolvedValue(true),
        // Word-specific methods
        getNoun: vi.fn().mockResolvedValue(null),
        getVerb: vi.fn().mockResolvedValue(null),
        getTags: vi.fn().mockResolvedValue([]),
        setTags: vi.fn().mockResolvedValue({}),
        setWords: vi.fn().mockResolvedValue({}),
        createNoun: vi.fn().mockResolvedValue({}),
        createVerb: vi.fn().mockResolvedValue({}),
        createTag: vi.fn().mockResolvedValue({}),
    }

    return instance
}

// Word mock factory
export const createMockWord = (overrides = {}) => ({
    wordId: 'test-word-id',
    english: 'test',
    arabic: 'اختبار',
    root: 'root',
    partOfSpeech: 'noun',
    noun: { meaning: 'option1' },
    verb: null,
    ...overrides,
})

// Helper to reset all mocks
export const resetDatabaseMocks = () => {
    Object.values(defaultDatabaseMock).forEach((model) => {
        if (typeof model === 'object' && model !== null) {
            Object.values(model).forEach((method) => {
                if (typeof method === 'function' && 'mockClear' in method) {
                    method.mockClear()
                }
            })
        }
    })
}
