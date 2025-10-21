import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createQuizToken, validateQuizToken, startQuiz, submitQuiz, getQuizResult, getQuizHistory, cleanupExpiredQuizTokens } from '@services/quiz.js'
import db from '@db/models/index.js'
import { StartQuizRequest, SubmitQuizRequest, QuizData, QuizQuestion, QuizAnswer, WordResult, QuizResult, QUIZ_TOKEN_CLASS } from '@types'

// Mock dependencies
vi.mock('@db/models/index.js')

describe('Quiz Service', () => {
    const mockUserId = 'test-user-id'
    const mockTokenId = 'test-token-id'
    const mockQuizId = 'test-quiz-id'

    const mockStartQuizRequest: StartQuizRequest = {
        selectedTags: ['tag1', 'tag2'],
        questionCount: 5,
    }

    const mockQuizData: QuizData = {
        quizId: mockQuizId,
        tokenId: mockTokenId,
        questions: [
            {
                questionId: 'q1',
                wordId: 'w1',
                word: 'test',
                partOfSpeech: 'noun',
                question: 'What is the meaning of "test"?',
                options: ['option1', 'option2', 'option3', 'option4'],
                correctAnswer: 0,
            },
        ],
        totalQuestions: 1,
        timeLimit: 300,
    }

    const mockSubmitQuizRequest: SubmitQuizRequest = {
        quizId: mockQuizId,
        tokenId: mockTokenId,
        answers: [
            {
                questionId: 'q1',
                selectedAnswer: 0,
                timeSpent: 30,
            },
        ],
    }

    const mockQuizResult: QuizResult = {
        quizId: mockQuizId,
        userId: mockUserId,
        totalQuestions: 1,
        correctAnswers: 1,
        totalTime: 30,
        score: 100,
        completedAt: new Date(),
        wordResults: [
            {
                wordId: 'w1',
                word: 'test',
                correct: true,
                selectedAnswer: 0,
                correctAnswer: 0,
                timeSpent: 30,
            },
        ],
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createQuizToken', () => {
        it('should create a quiz token successfully', async () => {
            const mockToken = {
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                save: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.tokens.build).mockReturnValue(mockToken as any)

            const result = await createQuizToken(mockUserId)

            expect(typeof result).toBe('string')
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            expect(db.tokens.build).toHaveBeenCalledWith({
                tokenId: expect.any(String),
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
            })
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
        it('should validate a valid quiz token', async () => {
            const mockToken = {
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                createdAt: new Date(),
            }

            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)

            const result = await validateQuizToken(mockTokenId, mockUserId)

            expect(result).toBe(true)
            expect(db.tokens.findOne).toHaveBeenCalledWith({
                where: {
                    tokenId: mockTokenId,
                    userId: mockUserId,
                    tokenClass: QUIZ_TOKEN_CLASS,
                    createdAt: expect.any(Object),
                },
            })
        })

        it('should return false for invalid token', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            const result = await validateQuizToken('invalid-token', mockUserId)

            expect(result).toBe(false)
        })

        it('should return false for expired token', async () => {
            // Mock the database to return null for expired tokens (since the query filters by createdAt)
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            const result = await validateQuizToken(mockTokenId, mockUserId)

            expect(result).toBe(false)
        })

        it('should handle database errors', async () => {
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))

            await expect(validateQuizToken(mockTokenId, mockUserId)).rejects.toThrow('Database error')
        })
    })

    describe('startQuiz', () => {
        it('should start a quiz successfully', async () => {
            const mockWords = [
                {
                    get: vi.fn().mockImplementation((key: string) => {
                        const data = {
                            wordId: 'w1',
                            english: 'test',
                            arabic: 'اختبار',
                            root: 'root',
                            partOfSpeech: 'noun',
                            noun: { meaning: 'option1' },
                            verb: null,
                        }
                        return data[key as keyof typeof data]
                    }),
                },
            ]

            const mockToken = {
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                save: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)
            vi.mocked(db.tokens.create).mockResolvedValue(mockToken as any)

            const result = await startQuiz(mockUserId, mockStartQuizRequest)

            expect(result).toBeDefined()
            expect(result.quizId).toBeDefined()
            expect(result.questions).toHaveLength(1)
            expect(db.tokens.destroy).toHaveBeenCalledWith({
                where: { userId: mockUserId, tokenClass: QUIZ_TOKEN_CLASS },
            })
            expect(db.words.findAll).toHaveBeenCalled()
        })

        it('should throw error when no tags selected', async () => {
            const invalidRequest: StartQuizRequest = {
                selectedTags: [],
                questionCount: 5,
            }

            await expect(startQuiz(mockUserId, invalidRequest)).rejects.toThrow('At least one tag must be selected')
        })

        it('should handle insufficient words', async () => {
            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue([])

            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toThrow('No words found for selected tags')
        })

        it('should handle database errors during cleanup', async () => {
            vi.mocked(db.tokens.destroy).mockRejectedValue(new Error('Database error'))

            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toThrow('Database error')
        })
    })

    describe('submitQuiz', () => {
        it('should submit quiz successfully', async () => {
            const mockQuizData = {
                quizId: mockQuizId,
                questions: [
                    {
                        wordId: 'w1',
                        english: 'test',
                        arabic: 'اختبار',
                        root: 'root',
                        partOfSpeech: 'noun',
                        noun: { meaning: 'option1' },
                        verb: null,
                    },
                ],
                selectedTags: ['tag1'],
                totalQuestions: 1,
                startedAt: new Date(),
            }

            const mockToken = {
                tokenId: mockQuizId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                payload: mockQuizData,
                destroy: vi.fn().mockResolvedValue({}),
            }

            const mockWord = {
                get: vi.fn().mockImplementation((key: string) => {
                    const data = {
                        wordId: 'w1',
                        english: 'test',
                        arabic: 'اختبار',
                        root: 'root',
                        partOfSpeech: 'noun',
                        noun: { meaning: 'option1' },
                        verb: null,
                    }
                    return data[key as keyof typeof data]
                }),
            }

            const mockQuizResult = {
                quizId: mockQuizId,
                userId: mockUserId,
                totalQuestions: 1,
                correctAnswers: 1,
                totalTime: 30,
                score: 100,
                completedAt: new Date(),
                wordResults: [],
                save: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)
            vi.mocked(db.quizResults.build).mockReturnValue(mockQuizResult as any)

            const result = await submitQuiz(mockUserId, mockSubmitQuizRequest)

            expect(result).toBeDefined()
            expect(result.quizId).toBe(mockQuizId)
            expect(result.score).toBe(100)
            expect(db.tokens.findOne).toHaveBeenCalled()
            expect(db.quizResults.build).toHaveBeenCalled()
            expect(mockQuizResult.save).toHaveBeenCalled()
        })

        it('should throw error for invalid token', async () => {
            vi.mocked(db.tokens.findOne).mockResolvedValue(null)

            await expect(submitQuiz(mockUserId, mockSubmitQuizRequest)).rejects.toThrow('Quiz session not found or expired')
        })

        it('should calculate correct score', async () => {
            const mockQuizData = {
                quizId: mockQuizId,
                questions: [
                    {
                        wordId: 'w1',
                        english: 'test',
                        arabic: 'اختبار',
                        root: 'root',
                        partOfSpeech: 'noun',
                        noun: { meaning: 'option1' },
                        verb: null,
                    },
                    {
                        wordId: 'w2',
                        english: 'test2',
                        arabic: 'اختبار2',
                        root: 'root2',
                        partOfSpeech: 'noun',
                        noun: { meaning: 'option2' },
                        verb: null,
                    },
                ],
                selectedTags: ['tag1'],
                totalQuestions: 2,
                startedAt: new Date(),
            }

            const mockToken = {
                tokenId: mockQuizId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                payload: mockQuizData,
                destroy: vi.fn().mockResolvedValue({}),
            }

            const mockWord = {
                get: vi.fn().mockImplementation((key: string) => {
                    const data = {
                        wordId: 'w1',
                        english: 'test',
                        arabic: 'اختبار',
                        root: 'root',
                        partOfSpeech: 'noun',
                        noun: { meaning: 'option1' },
                        verb: null,
                    }
                    return data[key as keyof typeof data]
                }),
            }

            const mockQuizResult = {
                quizId: mockQuizId,
                userId: mockUserId,
                totalQuestions: 2,
                correctAnswers: 1,
                totalTime: 60,
                score: 50,
                completedAt: new Date(),
                wordResults: [],
                save: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)
            vi.mocked(db.quizResults.build).mockReturnValue(mockQuizResult as any)

            const result = await submitQuiz(mockUserId, mockSubmitQuizRequest)

            expect(result.score).toBe(50)
        })

        it('should handle database errors', async () => {
            vi.mocked(db.tokens.findOne).mockRejectedValue(new Error('Database error'))

            await expect(submitQuiz(mockUserId, mockSubmitQuizRequest)).rejects.toThrow('Database error')
        })
    })

    describe('getQuizResult', () => {
        it('should get quiz result successfully', async () => {
            const mockResult = {
                get: vi.fn().mockImplementation((key: string) => {
                    const data = {
                        resultId: mockQuizId,
                        userId: mockUserId,
                        selectedTags: ['tag1'],
                        totalQuestions: 1,
                        correctAnswers: 1,
                        completedAt: new Date(),
                        wordResults: JSON.stringify([{ wordId: 'w1', correct: true }]),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                    return data[key as keyof typeof data]
                }),
            }

            vi.mocked(db.quizResults.findOne).mockResolvedValue(mockResult as any)

            const result = await getQuizResult(mockQuizId, mockUserId)

            expect(result).toBeDefined()
            expect(result?.resultId).toBe(mockQuizId)
            expect(db.quizResults.findOne).toHaveBeenCalledWith({
                where: { resultId: mockQuizId, userId: mockUserId },
            })
        })

        it('should return null when no results found', async () => {
            vi.mocked(db.quizResults.findOne).mockResolvedValue(null)

            const result = await getQuizResult(mockQuizId, mockUserId)

            expect(result).toBeNull()
        })

        it('should handle database errors', async () => {
            vi.mocked(db.quizResults.findOne).mockRejectedValue(new Error('Database error'))

            await expect(getQuizResult(mockQuizId, mockUserId)).rejects.toThrow('Database error')
        })
    })

    describe('cleanupExpiredQuizTokens', () => {
        it('should cleanup expired quiz tokens successfully', async () => {
            vi.mocked(db.tokens.destroy).mockResolvedValue(1)

            await cleanupExpiredQuizTokens()

            expect(db.tokens.destroy).toHaveBeenCalledWith({
                where: {
                    tokenClass: QUIZ_TOKEN_CLASS,
                    createdAt: expect.any(Object),
                },
            })
        })

        it('should handle database errors', async () => {
            vi.mocked(db.tokens.destroy).mockRejectedValue(new Error('Database error'))

            await expect(cleanupExpiredQuizTokens()).rejects.toThrow('Database error')
        })
    })

    describe('Quiz Logic', () => {
        it('should generate questions with correct structure', async () => {
            const mockWords = [
                {
                    get: vi.fn().mockImplementation((key: string) => {
                        const data = {
                            wordId: 'w1',
                            english: 'test',
                            arabic: 'اختبار',
                            root: 'root',
                            partOfSpeech: 'noun',
                            noun: { meaning: 'A procedure for evaluation' },
                            verb: null,
                        }
                        return data[key as keyof typeof data]
                    }),
                },
            ]

            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)
            vi.mocked(db.tokens.create).mockResolvedValue({
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                save: vi.fn().mockResolvedValue({}),
            } as any)

            const result = await startQuiz(mockUserId, mockStartQuizRequest)

            expect(result.questions[0]).toHaveProperty('wordId')
            expect(result.questions[0]).toHaveProperty('english')
            expect(result.questions[0]).toHaveProperty('arabic')
            expect(result.questions[0]).toHaveProperty('root')
            expect(result.questions[0]).toHaveProperty('partOfSpeech')
            expect(result.questions[0]).toHaveProperty('noun')
            expect(result.questions[0]).toHaveProperty('verb')
        })

        it('should handle different parts of speech', async () => {
            const mockWords = [
                {
                    get: vi.fn().mockImplementation((key: string) => {
                        const data = {
                            wordId: 'w1',
                            english: 'run',
                            arabic: 'ركض',
                            root: 'root',
                            partOfSpeech: 'verb',
                            noun: null,
                            verb: { meaning: 'To move quickly on foot' },
                        }
                        return data[key as keyof typeof data]
                    }),
                },
            ]

            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)
            vi.mocked(db.tokens.create).mockResolvedValue({
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                save: vi.fn().mockResolvedValue({}),
            } as any)

            const result = await startQuiz(mockUserId, mockStartQuizRequest)

            expect(result.questions[0].partOfSpeech).toBe('verb')
            expect(result.questions[0].english).toBe('run')
        })
    })

    describe('Error Handling', () => {
        it('should handle malformed quiz data', async () => {
            const mockWords = [
                {
                    wordId: 'w1',
                    word: 'test',
                    partOfSpeech: 'noun',
                    nouns: null, // Missing meaning
                    verbs: null,
                },
            ]

            vi.mocked(db.tokens.destroy).mockResolvedValue(1)
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)

            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toThrow()
        })

        it('should handle invalid answer format', async () => {
            const invalidRequest: SubmitQuizRequest = {
                quizId: mockQuizId,
                tokenId: mockTokenId,
                answers: [
                    {
                        questionId: 'q1',
                        selectedAnswer: -1, // Invalid answer
                        timeSpent: 30,
                    },
                ],
            }

            const mockToken = {
                tokenId: mockTokenId,
                userId: mockUserId,
                tokenClass: QUIZ_TOKEN_CLASS,
                createdAt: new Date(),
            }

            vi.mocked(db.tokens.findOne).mockResolvedValue(mockToken as any)

            await expect(submitQuiz(mockUserId, invalidRequest)).rejects.toThrow()
        })
    })
})
