import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import quizRouter from '@routes/quiz/index.js'
import { verifycookie } from '@util/cookie.js'
import { validateBody, validateQuery } from '@util/validation.js'
import { startQuiz, submitQuiz, getQuizResult, getQuizHistory, cleanupExpiredQuizTokens } from '@services/quiz.js'
import { StartQuizRequest, SubmitQuizRequest, QuizData, QuizResult } from '@types'

// Mock dependencies
vi.mock('@util/cookie.js')
vi.mock('@util/validation.js')
vi.mock('@services/quiz.js')

// Mock validation middleware
vi.mocked(validateBody).mockImplementation(() => (req: any, res: any, next: any) => next())
vi.mocked(validateQuery).mockImplementation(() => (req: any, res: any, next: any) => next())

// Mock cookie verification middleware
vi.mocked(verifycookie).mockImplementation(async (req: any, res: any, next: any) => {
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
})

describe('Quiz Routes', () => {
    let app: express.Application

    const mockUserId = 'test-user-id'
    const mockQuizId = 'test-quiz-id'
    const mockTokenId = 'test-token-id'

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
        timeSpent: 30,
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
        app = express()
        app.use(express.json())
        app.use('/api/quiz', quizRouter)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('POST /api/quiz/start', () => {
        it('should start quiz successfully', async () => {
            vi.mocked(startQuiz).mockResolvedValue(mockQuizData)

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(200)

            expect(response.body).toEqual(mockQuizData)
            expect(startQuiz).toHaveBeenCalledWith(mockUserId, mockStartQuizRequest)
        })

        it('should handle quiz start errors', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new Error('Not enough words available'))

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(500)

            expect(response.body).toEqual({ error: 'Not enough words available' })
        })

        it('should handle invalid request data', async () => {
            const invalidRequest = {
                selectedTags: [], // Invalid: empty tags
                questionCount: 5,
            }

            vi.mocked(startQuiz).mockRejectedValue(new Error('At least one tag must be selected'))

            const response = await request(app).post('/api/quiz/start').send(invalidRequest).expect(500)

            expect(response.body).toEqual({ error: 'At least one tag must be selected' })
        })

        it('should handle authentication errors', async () => {
            vi.mocked(verifycookie).mockImplementationOnce((req: any, res: any, next: any) => {
                res.status(403).send({ error: 'Unauthorized' })
            })

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(403)

            expect(response.body).toEqual({ error: 'Unauthorized' })
        })

        it('should handle unexpected errors', async () => {
            vi.mocked(startQuiz).mockImplementation(() => {
                throw 'String error'
            })

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(500)

            expect(response.body).toEqual({ error: 'Unknown error' })
        })
    })

    describe('POST /api/quiz/submit', () => {
        it('should submit quiz successfully', async () => {
            vi.mocked(submitQuiz).mockResolvedValue(mockQuizResult)

            const response = await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(200)

            expect(response.body).toEqual({
                ...mockQuizResult,
                score: 100,
                timeSpent: 30,
            })
            expect(submitQuiz).toHaveBeenCalledWith(mockUserId, mockSubmitQuizRequest)
        })

        it('should calculate score correctly', async () => {
            const partialResult = {
                ...mockQuizResult,
                totalQuestions: 4,
                correctAnswers: 3,
            }

            vi.mocked(submitQuiz).mockResolvedValue(partialResult)

            const response = await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(200)

            expect(response.body.score).toBe(75) // 3/4 * 100 = 75
        })

        it('should handle quiz submission errors', async () => {
            vi.mocked(submitQuiz).mockRejectedValue(new Error('Invalid or expired quiz token'))

            const response = await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(500)

            expect(response.body).toEqual({ error: 'Invalid or expired quiz token' })
        })

        it('should handle invalid quiz data', async () => {
            const invalidRequest = {
                quizId: 'invalid-quiz',
                tokenId: 'invalid-token',
                answers: [],
                timeSpent: 30,
            }

            vi.mocked(submitQuiz).mockRejectedValue(new Error('Invalid quiz data'))

            const response = await request(app).post('/api/quiz/submit').send(invalidRequest).expect(500)

            expect(response.body).toEqual({ error: 'Invalid quiz data' })
        })

        it('should handle authentication errors', async () => {
            vi.mocked(verifycookie).mockImplementationOnce((req: any, res: any, next: any) => {
                res.status(403).send({ error: 'Unauthorized' })
            })

            const response = await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(403)

            expect(response.body).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('GET /api/quiz/result/:quizId', () => {
        it('should get quiz result successfully', async () => {
            vi.mocked(getQuizResult).mockResolvedValue(mockQuizResult)

            const response = await request(app).get(`/api/quiz/result/${mockQuizId}`).expect(200)

            expect(response.body).toEqual(mockQuizResult)
            expect(getQuizResult).toHaveBeenCalledWith(mockQuizId, mockUserId)
        })

        it('should handle quiz result not found', async () => {
            vi.mocked(getQuizResult).mockRejectedValue(new Error('Quiz result not found'))

            const response = await request(app).get(`/api/quiz/result/non-existent-quiz`).expect(500)

            expect(response.body).toEqual({ error: 'Quiz result not found' })
        })

        it('should handle authentication errors', async () => {
            vi.mocked(verifycookie).mockImplementationOnce((req: any, res: any, next: any) => {
                res.status(403).send({ error: 'Unauthorized' })
            })

            const response = await request(app).get(`/api/quiz/result/${mockQuizId}`).expect(403)

            expect(response.body).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('GET /api/quiz/history', () => {
        it('should get quiz history successfully', async () => {
            const mockHistory = [mockQuizResult]
            vi.mocked(getQuizHistory).mockResolvedValue(mockHistory)

            const response = await request(app).get('/api/quiz/history').expect(200)

            expect(response.body).toEqual(mockHistory)
            expect(getQuizHistory).toHaveBeenCalledWith(mockUserId)
        })

        it('should get quiz history with pagination', async () => {
            const mockHistory = [mockQuizResult]
            vi.mocked(getQuizHistory).mockResolvedValue(mockHistory)

            const response = await request(app).get('/api/quiz/history?page=2&limit=5').expect(200)

            expect(response.body).toEqual(mockHistory)
            expect(getQuizHistory).toHaveBeenCalledWith(mockUserId, 2, 5)
        })

        it('should return empty history when no results', async () => {
            vi.mocked(getQuizHistory).mockResolvedValue([])

            const response = await request(app).get('/api/quiz/history').expect(200)

            expect(response.body).toEqual([])
        })

        it('should handle quiz history errors', async () => {
            vi.mocked(getQuizHistory).mockRejectedValue(new Error('Database error'))

            const response = await request(app).get('/api/quiz/history').expect(500)

            expect(response.body).toEqual({ error: 'Database error' })
        })

        it('should handle authentication errors', async () => {
            vi.mocked(verifycookie).mockImplementationOnce((req: any, res: any, next: any) => {
                res.status(403).send({ error: 'Unauthorized' })
            })

            const response = await request(app).get('/api/quiz/history').expect(403)

            expect(response.body).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('Service Integration', () => {
        it('should call quiz service methods correctly', async () => {
            vi.mocked(startQuiz).mockResolvedValue(mockQuizData)
            vi.mocked(submitQuiz).mockResolvedValue(mockQuizResult)
            vi.mocked(getQuizResult).mockResolvedValue(mockQuizResult)
            vi.mocked(getQuizHistory).mockResolvedValue([mockQuizResult])

            // Test start quiz
            await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(200)

            expect(startQuiz).toHaveBeenCalledWith(mockUserId, mockStartQuizRequest)

            // Test submit quiz
            await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(200)

            expect(submitQuiz).toHaveBeenCalledWith(mockUserId, mockSubmitQuizRequest)

            // Test get result
            await request(app).get(`/api/quiz/result/${mockQuizId}`).expect(200)

            expect(getQuizResult).toHaveBeenCalledWith(mockQuizId, mockUserId)

            // Test get history
            await request(app).get('/api/quiz/history').expect(200)

            expect(getQuizHistory).toHaveBeenCalledWith(mockUserId)
        })

        it('should handle service errors properly', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new Error('Service error'))

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(500)

            expect(response.body).toEqual({ error: 'Service error' })
        })
    })

    describe('Cleanup Functionality', () => {
        it('should handle cleanup errors gracefully', async () => {
            // Mock the cleanup function to throw an error
            vi.mocked(cleanupExpiredQuizTokens).mockRejectedValue(new Error('Cleanup error'))

            // The cleanup runs in setInterval, so we can't directly test it
            // But we can verify the function exists and can be called
            expect(cleanupExpiredQuizTokens).toBeDefined()
        })
    })

    describe('Request Validation', () => {
        it('should validate start quiz request body', async () => {
            vi.mocked(startQuiz).mockResolvedValue(mockQuizData)

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(200)

            expect(validateBody).toHaveBeenCalled()
            expect(response.body).toEqual(mockQuizData)
        })

        it('should validate submit quiz request body', async () => {
            vi.mocked(submitQuiz).mockResolvedValue(mockQuizResult)

            const response = await request(app).post('/api/quiz/submit').send(mockSubmitQuizRequest).expect(200)

            expect(validateBody).toHaveBeenCalled()
            expect(response.body).toBeDefined()
        })

        it('should validate quiz history query parameters', async () => {
            vi.mocked(getQuizHistory).mockResolvedValue([])

            const response = await request(app).get('/api/quiz/history?page=1&limit=10').expect(200)

            expect(validateQuery).toHaveBeenCalled()
            expect(response.body).toEqual([])
        })
    })

    describe('Error Handling', () => {
        it('should handle malformed request body', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new Error('Invalid request format'))

            const response = await request(app).post('/api/quiz/start').send({ invalid: 'data' }).expect(500)

            expect(response.body).toEqual({ error: 'Invalid request format' })
        })

        it('should handle missing required fields', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new Error('Missing required fields'))

            const response = await request(app).post('/api/quiz/start').send({}).expect(500)

            expect(response.body).toEqual({ error: 'Missing required fields' })
        })

        it('should handle database connection errors', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new Error('Database connection failed'))

            const response = await request(app).post('/api/quiz/start').send(mockStartQuizRequest).expect(500)

            expect(response.body).toEqual({ error: 'Database connection failed' })
        })
    })
})
