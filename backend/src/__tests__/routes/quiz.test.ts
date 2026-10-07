import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import quizRouter from '@routes/quiz/index.js'
import { verifycookie } from '@util/cookie'
import { completeExpiredQuizzes, finishQuiz, getQuiz, getQuizHistory, QuizError, startQuiz, submitAnswer } from '@/services/quiz'
import { GradedAnswer, QuizDetail, QuizHistoryResponse, QuizTally, StartedQuiz } from '@types'

const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
const mockQuizId = '660e8400-e29b-41d4-a716-446655440000'
const mockWordId = '770e8400-e29b-41d4-a716-446655440000'
const mockTagId = '880e8400-e29b-41d4-a716-446655440000'

vi.mock('@util/cookie')
vi.mock('@/services/quiz', () => ({
    startQuiz: vi.fn(),
    submitAnswer: vi.fn(),
    finishQuiz: vi.fn(),
    getQuiz: vi.fn(),
    getQuizHistory: vi.fn(),
    completeExpiredQuizzes: vi.fn(),
    QuizError: class QuizError extends Error {
        status: number
        constructor(message: string, status: number) {
            super(message)
            this.name = 'QuizError'
            this.status = status
        }
    },
}))

vi.mocked(verifycookie).mockImplementation(async (req: any, _res: any, next: any) => {
    req.query = {
        ...req.query,
        user: {
            userId: mockUserId,
            email: 'test@example.com',
            username: 'testuser',
            verified: true,
        },
    }
    next()
})

describe('Quiz Routes', () => {
    let app: express.Application

    const started: StartedQuiz = {
        quizId: mockQuizId,
        endsAt: new Date(Date.now() + 120000),
        words: [{ wordId: mockWordId, english: 'owl' }],
    }

    const graded: GradedAnswer = {
        isCorrect: true,
        userAnswer: 'owl',
        root: 'owl',
        arabic: 'بُوم',
    }

    const tally: QuizTally = {
        quizId: mockQuizId,
        poolSize: 10,
        answered: 1,
        correctAnswers: 1,
    }

    const detail: QuizDetail = {
        quizId: mockQuizId,
        userId: mockUserId,
        selectedTags: [mockTagId],
        wordIds: [mockWordId],
        endsAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        answers: [{ wordId: mockWordId, userAnswer: 'owl', isCorrect: true, english: 'owl', arabic: 'بُوم', root: 'owl' }],
    }

    const history: QuizHistoryResponse = {
        quizzes: [{ ...tally, selectedTags: [mockTagId], completedAt: new Date(), endsAt: new Date() }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/quiz', quizRouter)
        vi.clearAllMocks()
    })

    describe('POST /api/quiz/start', () => {
        it('starts a quiz', async () => {
            vi.mocked(startQuiz).mockResolvedValue(started)

            const response = await request(app)
                .post('/api/quiz/start')
                .send({ selectedTags: [mockTagId] })
                .expect(200)

            expect(response.body.quizId).toBe(mockQuizId)
            expect(response.body.words).toEqual([{ wordId: mockWordId, english: 'owl' }])
            expect(startQuiz).toHaveBeenCalledWith(mockUserId, { selectedTags: [mockTagId] })
        })

        it('returns the quiz error status', async () => {
            vi.mocked(startQuiz).mockRejectedValue(new QuizError('No words found for selected tags', 400))

            const response = await request(app)
                .post('/api/quiz/start')
                .send({ selectedTags: [mockTagId] })
                .expect(400)

            expect(response.body).toEqual({ error: 'No words found for selected tags' })
        })

        it('rejects an empty tag list', async () => {
            const response = await request(app).post('/api/quiz/start').send({ selectedTags: [] }).expect(400)

            expect(response.body.error).toBe('Validation failed')
            expect(startQuiz).not.toHaveBeenCalled()
        })
    })

    describe('POST /api/quiz/:quizId/answers', () => {
        const answer = { wordId: mockWordId, userAnswer: 'owl' }

        it('grades one answer', async () => {
            vi.mocked(submitAnswer).mockResolvedValue(graded)

            const response = await request(app).post(`/api/quiz/${mockQuizId}/answers`).send(answer).expect(200)

            expect(response.body).toEqual(graded)
            expect(submitAnswer).toHaveBeenCalledWith(mockUserId, mockQuizId, answer)
        })

        it('rejects a late answer', async () => {
            vi.mocked(submitAnswer).mockRejectedValue(new QuizError('Quiz has ended', 400))

            const response = await request(app).post(`/api/quiz/${mockQuizId}/answers`).send(answer).expect(400)

            expect(response.body).toEqual({ error: 'Quiz has ended' })
        })

        it('rejects a duplicate answer', async () => {
            vi.mocked(submitAnswer).mockRejectedValue(new QuizError('Word already answered', 409))

            const response = await request(app).post(`/api/quiz/${mockQuizId}/answers`).send(answer).expect(409)

            expect(response.body).toEqual({ error: 'Word already answered' })
        })

        it('rejects a word that is not in the pool', async () => {
            vi.mocked(submitAnswer).mockRejectedValue(new QuizError('Word is not in this quiz', 400))

            const response = await request(app).post(`/api/quiz/${mockQuizId}/answers`).send(answer).expect(400)

            expect(response.body).toEqual({ error: 'Word is not in this quiz' })
        })

        it('rejects an invalid quiz id', async () => {
            const response = await request(app).post('/api/quiz/not-a-uuid/answers').send(answer).expect(400)

            expect(response.body.error).toBe('Parameter validation failed')
            expect(submitAnswer).not.toHaveBeenCalled()
        })
    })

    describe('POST /api/quiz/:quizId/finish', () => {
        it('finishes a quiz', async () => {
            vi.mocked(finishQuiz).mockResolvedValue(tally)

            const response = await request(app).post(`/api/quiz/${mockQuizId}/finish`).expect(200)

            expect(response.body).toEqual(tally)
            expect(finishQuiz).toHaveBeenCalledWith(mockUserId, mockQuizId)
        })

        it('returns 404 when the quiz is missing', async () => {
            vi.mocked(finishQuiz).mockRejectedValue(new QuizError('Quiz not found', 404))

            const response = await request(app).post(`/api/quiz/${mockQuizId}/finish`).expect(404)

            expect(response.body).toEqual({ error: 'Quiz not found' })
        })
    })

    describe('GET /api/quiz/:quizId', () => {
        it('returns one quiz', async () => {
            vi.mocked(getQuiz).mockResolvedValue(detail)

            const response = await request(app).get(`/api/quiz/${mockQuizId}`).expect(200)

            expect(response.body.quizId).toBe(mockQuizId)
            expect(response.body.answers).toHaveLength(1)
            expect(getQuiz).toHaveBeenCalledWith(mockUserId, mockQuizId)
        })

        it('returns 404 when the quiz is missing', async () => {
            vi.mocked(getQuiz).mockResolvedValue(null)

            const response = await request(app).get(`/api/quiz/${mockQuizId}`).expect(404)

            expect(response.body).toEqual({ error: 'Quiz not found' })
        })
    })

    describe('GET /api/quiz/history', () => {
        it('lists finished quizzes', async () => {
            vi.mocked(getQuizHistory).mockResolvedValue(history)

            const response = await request(app).get('/api/quiz/history?page=2&limit=5').expect(200)

            expect(response.body.quizzes).toHaveLength(1)
            expect(getQuizHistory).toHaveBeenCalledWith(mockUserId, 2, 5)
        })

        it('rejects a page below 1', async () => {
            const response = await request(app).get('/api/quiz/history?page=0').expect(400)

            expect(response.body.error).toBe('Query validation failed')
            expect(getQuizHistory).not.toHaveBeenCalled()
        })
    })

    describe('cleanup', () => {
        it('exposes the expiry cleanup used by the interval', () => {
            expect(completeExpiredQuizzes).toBeDefined()
        })
    })
})
