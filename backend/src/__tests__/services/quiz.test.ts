import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createQuizToken, validateQuizToken, startQuiz, submitQuiz, getQuizResult, getQuizHistory, cleanupExpiredQuizTokens } from '@services/quiz.js'
import db from '@db/models/index.js'
import { StartQuizRequest, SubmitQuizRequest, QuizData, QuizQuestion, QuizAnswer, WordResult, QuizResult, QUIZ_TOKEN_CLASS } from '@types'
import { mockUserId, mockTokenId, mockQuizId, mockStartQuizRequest, mockSubmitQuizRequest, mockQuizData, mockQuizResult, createMockToken, createMockWord, createMockQuizData, createMockQuizResult, createMockStartQuizRequest, createMockInstance } from '../mocks/index.js'

// Mock dependencies
vi.mock('@db/models/index.js')

describe('Quiz Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createQuizToken', () => {
        it('should create a quiz token successfully', async () => {
            const mockToken = createMockToken({ tokenId: mockTokenId, userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS })
            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)

            const result = await createQuizToken(mockUserId)

            expect(typeof result).toBe('string')
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            expect(db.tokens.build).toHaveBeenCalledWith({ tokenId: expect.any(String), userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS })
            expect(mockToken.save).toHaveBeenCalled()
        })

        it('should handle token creation errors', async () => {
            vi.mocked(db.tokens.build).mockImplementation(() => {
                throw new Error('Database error')
            })
            await expect(createQuizToken(mockUserId)).rejects.toThrow('Database error')
        })
    })

    describe('validateQuizToken', () => {
        it('should validate tokens correctly', async () => {
            // Valid token
            const mockToken = createMockToken({ tokenId: mockTokenId, userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS, createdAt: new Date() })
            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)
            const validResult = await validateQuizToken(mockTokenId, mockUserId)
            expect(validResult).toBe(true)
            expect(db.tokens.findOne).toHaveBeenCalledWith({ where: { tokenId: mockTokenId, userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS, createdAt: expect.any(Object) } })

            // Invalid token
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            const invalidResult = await validateQuizToken('invalid-token', mockUserId)
            expect(invalidResult).toBe(false)

            // Database error
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))
            await expect(validateQuizToken(mockTokenId, mockUserId)).rejects.toThrow('Database error')
        })
    })

    describe('startQuiz', () => {
        it('should start a quiz successfully', async () => {
            const mockWord = createMockInstance(createMockWord())
            const mockWords = [mockWord]

            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)
            vi.mocked(db.tokens.create).mockResolvedValue({} as any)

            const result = await startQuiz(mockUserId, mockStartQuizRequest)

            expect(result).toBeDefined()
            expect(result.quizId).toBeDefined()
            expect(result.questions).toHaveLength(1)
            expect(db.tokens.destroy).toHaveBeenCalledWith({ where: { userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS } })
            expect(db.words.findAll).toHaveBeenCalled()
        })

        it('should handle various error scenarios', async () => {
            // No tags selected
            const invalidRequest = createMockStartQuizRequest({ selectedTags: [] })
            await expect(startQuiz(mockUserId, invalidRequest)).rejects.toThrow('At least one tag must be selected')

            // Insufficient words
            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue([])
            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toThrow('No words found for selected tags')

            // Database cleanup error
            vi.mocked(db.tokens.destroy).mockRejectedValue(new Error('Database error'))
            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toThrow('Database error')
        })
    })

    describe('submitQuiz', () => {
        it('should submit quiz successfully', async () => {
            const mockQuizData = {
                quizId: mockQuizId,
                questions: [{ wordId: 'w1', english: 'test', arabic: 'اختبار', root: 'root', partOfSpeech: 'noun', noun: { meaning: 'option1' }, verb: null }],
                selectedTags: ['tag1'],
                totalQuestions: 1,
                startedAt: new Date(),
            }

            const mockToken = createMockInstance({ tokenId: mockQuizId, userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS, payload: mockQuizData })
            const mockWord = createMockInstance(createMockWord())
            const mockQuizResult = createMockInstance({ userId: mockUserId, totalQuestions: 1, correctAnswers: 1, completedAt: new Date(), wordResults: [] })

            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)
            vi.mocked(db.quizResults.build).mockReturnValue(mockQuizResult as any)

            const result = await submitQuiz(mockUserId, mockSubmitQuizRequest)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('resultId')
            expect(result).toHaveProperty('correctAnswers')
            expect(db.tokens.findOne).toHaveBeenCalled()
            expect(db.quizResults.build).toHaveBeenCalled()
            expect(mockQuizResult.save).toHaveBeenCalled()
        })

        it('should handle various error scenarios', async () => {
            // Invalid token
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)
            await expect(submitQuiz(mockUserId, mockSubmitQuizRequest)).rejects.toThrow('Quiz session not found or expired')

            // Database error
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))
            await expect(submitQuiz(mockUserId, mockSubmitQuizRequest)).rejects.toThrow('Database error')
        })
    })

    describe('getQuizResult', () => {
        it('should get quiz result successfully', async () => {
            const mockQuizResult = createMockInstance({
                resultId: mockQuizId,
                userId: mockUserId,
                selectedTags: ['tag1'],
                totalQuestions: 1,
                correctAnswers: 1,
                completedAt: new Date(),
                wordResults: JSON.stringify([{ wordId: 'w1', correct: true }]),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            vi.mocked(db.quizResults.findOne).mockResolvedValue(mockQuizResult as any)

            const result = await getQuizResult(mockQuizId, mockUserId)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('resultId')
            expect(db.quizResults.findOne).toHaveBeenCalledWith({ where: { resultId: mockQuizId, userId: mockUserId } })
        })

        it('should handle quiz not found', async () => {
            vi.mocked(db.quizResults.findOne).mockResolvedValue(null)
            const result = await getQuizResult(mockQuizId, mockUserId)
            expect(result).toBeNull()
        })
    })

    describe('getQuizHistory', () => {
        it('should get quiz history successfully', async () => {
            const mockResults = [createMockInstance({ resultId: 'r1', userId: mockUserId, wordResults: JSON.stringify([]) }), createMockInstance({ resultId: 'r2', userId: mockUserId, wordResults: JSON.stringify([]) })]
            vi.mocked(db.quizResults.findAndCountAll).mockResolvedValue({ count: 2, rows: mockResults } as any)

            const result = await getQuizHistory(mockUserId)

            expect(result).toHaveProperty('quizResults')
            expect(result).toHaveProperty('pagination')
            expect(result.quizResults).toHaveLength(2)
            expect(db.quizResults.findAndCountAll).toHaveBeenCalledWith({
                where: { userId: mockUserId },
                order: [['completedAt', 'DESC']],
                limit: 10,
                offset: 0,
                attributes: ['resultId', 'selectedTags', 'totalQuestions', 'correctAnswers', 'completedAt'],
            })
        })
    })

    describe('cleanupExpiredQuizTokens', () => {
        it('should cleanup expired tokens', async () => {
            vi.mocked(db.tokens.destroy).mockResolvedValue(5)

            const result = await cleanupExpiredQuizTokens()

            expect(result).toBeUndefined()
            expect(db.tokens.destroy).toHaveBeenCalledWith({ where: { tokenClass: QUIZ_TOKEN_CLASS, createdAt: expect.any(Object) } })
        })
    })
})
