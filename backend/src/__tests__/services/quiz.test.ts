import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UniqueConstraintError } from 'sequelize'
import { completeExpiredQuizzes, finishQuiz, getQuiz, getQuizHistory, QuizError, startQuiz, submitAnswer } from '@services/quiz.js'
import db from '@db/models/index.js'
import { withTransaction } from '@util/transaction.js'
import { mockQuizId, mockStartQuizRequest, mockSubmitAnswerRequest, mockTagId, mockWordId, createMockStartQuizRequest } from '../mocks/index.js'
import { createMockInstance } from '../mocks/database.js'
import { mockUserId } from '../mocks/users.js'

vi.mock('@db/models/index.js', () => ({
    default: {
        words: { findAll: vi.fn(), findOne: vi.fn() },
        tags: {},
        quizzes: { update: vi.fn(), create: vi.fn(), findOne: vi.fn(), findAndCountAll: vi.fn() },
        answers: { findOne: vi.fn(), create: vi.fn() },
        sequelize: { query: vi.fn(), random: vi.fn() },
    },
}))

vi.mock('@util/transaction.js', () => ({
    withTransaction: vi.fn((fn: (transaction: object) => Promise<unknown>) => fn({})),
}))

const openQuiz = (overrides: Record<string, unknown> = {}) =>
    createMockInstance({
        quizId: mockQuizId,
        userId: mockUserId,
        wordIds: [mockWordId],
        endsAt: new Date(Date.now() + 60_000),
        completedAt: null,
        selectedTags: [mockTagId],
        ...overrides,
    })

describe('Quiz Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('startQuiz', () => {
        it('closes other quizzes and returns prompts without the root', async () => {
            vi.mocked(db.words.findAll).mockResolvedValue([createMockInstance({ wordId: mockWordId, english: 'owl', root: 'owl', arabic: 'بُوم' })] as any)

            const result = await startQuiz(mockUserId, mockStartQuizRequest)

            expect(result.words).toEqual([{ wordId: mockWordId, english: 'owl' }])
            expect(result.endsAt.getTime() - Date.now()).toBeGreaterThan(110_000)
            expect(result.endsAt.getTime() - Date.now()).toBeLessThanOrEqual(120_000)
            expect(withTransaction).toHaveBeenCalled()
            expect(db.quizzes.update).toHaveBeenCalledWith({ completedAt: expect.any(Date) }, { where: { userId: mockUserId, completedAt: null }, transaction: {} })
            expect(db.quizzes.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    selectedTags: [mockTagId],
                    wordIds: [mockWordId],
                    completedAt: null,
                }),
                { transaction: {} },
            )
        })

        it('rejects an empty tag list', async () => {
            await expect(startQuiz(mockUserId, createMockStartQuizRequest({ selectedTags: [] }))).rejects.toMatchObject({
                message: 'At least one tag must be selected',
                status: 400,
            })
            expect(db.words.findAll).not.toHaveBeenCalled()
        })

        it('rejects when no words match the tags', async () => {
            vi.mocked(db.words.findAll).mockResolvedValue([])
            await expect(startQuiz(mockUserId, mockStartQuizRequest)).rejects.toMatchObject({
                message: 'No words found for selected tags',
                status: 400,
            })
            expect(db.quizzes.create).not.toHaveBeenCalled()
        })
    })

    describe('submitAnswer', () => {
        it('grades a trimmed answer against the root and stores it', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz() as any)
            vi.mocked(db.answers.findOne).mockResolvedValue(null)
            vi.mocked(db.words.findOne).mockResolvedValue(createMockInstance({ root: 'Owl', arabic: 'بُوم' }) as any)

            const result = await submitAnswer(mockUserId, mockQuizId, { wordId: mockWordId, userAnswer: '  owl  ' })

            expect(result).toEqual({ isCorrect: true, userAnswer: 'owl', root: 'Owl', arabic: 'بُوم' })
            expect(db.answers.create).toHaveBeenCalledWith({
                quizId: mockQuizId,
                wordId: mockWordId,
                userAnswer: 'owl',
                isCorrect: true,
            })
        })

        it('stores a wrong answer', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz() as any)
            vi.mocked(db.answers.findOne).mockResolvedValue(null)
            vi.mocked(db.words.findOne).mockResolvedValue(createMockInstance({ root: 'owl', arabic: 'بُوم' }) as any)

            const result = await submitAnswer(mockUserId, mockQuizId, { wordId: mockWordId, userAnswer: 'cat' })

            expect(result.isCorrect).toBe(false)
            expect(db.answers.create).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: false, userAnswer: 'cat' }))
        })

        it('rejects a late answer', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz({ endsAt: new Date(Date.now() - 1000) }) as any)

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toMatchObject({
                message: 'Quiz has ended',
                status: 400,
            })
            expect(db.answers.create).not.toHaveBeenCalled()
        })

        it('rejects a duplicate answer', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz() as any)
            vi.mocked(db.answers.findOne).mockResolvedValue({ wordId: mockWordId } as any)

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toMatchObject({
                message: 'Word already answered',
                status: 409,
            })
        })

        it('rejects a duplicate insert that loses the race', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz() as any)
            vi.mocked(db.answers.findOne).mockResolvedValue(null)
            vi.mocked(db.words.findOne).mockResolvedValue(createMockInstance({ root: 'owl', arabic: 'بُوم' }) as any)
            vi.mocked(db.answers.create).mockRejectedValue(new UniqueConstraintError({}))

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toBeInstanceOf(QuizError)
        })

        it('rejects a word that is not in the pool', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz({ wordIds: ['other-word'] }) as any)

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toMatchObject({
                message: 'Word is not in this quiz',
                status: 400,
            })
            expect(db.words.findOne).not.toHaveBeenCalled()
        })

        it('rejects an answer on a finished quiz', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(openQuiz({ completedAt: new Date() }) as any)

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toMatchObject({
                message: 'Quiz is already finished',
                status: 409,
            })
        })

        it('rejects an unknown quiz', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(null)

            await expect(submitAnswer(mockUserId, mockQuizId, mockSubmitAnswerRequest)).rejects.toMatchObject({
                message: 'Quiz not found',
                status: 404,
            })
        })
    })

    describe('finishQuiz', () => {
        it('sets completedAt and counts saved answers against the pool', async () => {
            const quiz = openQuiz({ wordIds: [mockWordId, 'skipped-word'] })
            vi.mocked(db.quizzes.findOne).mockResolvedValue(quiz as any)
            vi.mocked(db.sequelize.query).mockResolvedValue([{ quizId: mockQuizId, answered: '1', correctAnswers: '1' }] as any)

            const tally = await finishQuiz(mockUserId, mockQuizId)

            expect(quiz.save).toHaveBeenCalled()
            expect(tally).toEqual({ quizId: mockQuizId, poolSize: 2, answered: 1, correctAnswers: 1 })
        })

        it('returns zeros when nothing was answered', async () => {
            const quiz = openQuiz()
            vi.mocked(db.quizzes.findOne).mockResolvedValue(quiz as any)
            vi.mocked(db.sequelize.query).mockResolvedValue([] as any)

            const tally = await finishQuiz(mockUserId, mockQuizId)

            expect(tally.answered).toBe(0)
            expect(tally.correctAnswers).toBe(0)
        })

        it('does not overwrite an existing completedAt', async () => {
            const quiz = openQuiz({ completedAt: new Date('2020-01-01') })
            vi.mocked(db.quizzes.findOne).mockResolvedValue(quiz as any)
            vi.mocked(db.sequelize.query).mockResolvedValue([] as any)

            await finishQuiz(mockUserId, mockQuizId)

            expect(quiz.save).not.toHaveBeenCalled()
        })

        it('rejects an unknown quiz', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(null)
            await expect(finishQuiz(mockUserId, mockQuizId)).rejects.toMatchObject({ status: 404 })
        })
    })

    describe('getQuiz', () => {
        it('joins answers to word text', async () => {
            const plain = {
                quizId: mockQuizId,
                userId: mockUserId,
                selectedTags: [mockTagId],
                wordIds: [mockWordId],
                endsAt: new Date(),
                completedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                answers: [{ wordId: mockWordId, userAnswer: 'owl', isCorrect: 1, word: { english: 'owl', arabic: 'بُوم', root: 'owl' } }],
            }
            vi.mocked(db.quizzes.findOne).mockResolvedValue({ get: vi.fn().mockReturnValue(plain) } as any)

            const quiz = await getQuiz(mockUserId, mockQuizId)

            expect(quiz?.answers).toEqual([{ wordId: mockWordId, userAnswer: 'owl', isCorrect: true, english: 'owl', arabic: 'بُوم', root: 'owl' }])
        })

        it('returns null when the quiz is missing', async () => {
            vi.mocked(db.quizzes.findOne).mockResolvedValue(null)
            await expect(getQuiz(mockUserId, mockQuizId)).resolves.toBeNull()
        })
    })

    describe('getQuizHistory', () => {
        it('lists finished quizzes with answer counts', async () => {
            const completedAt = new Date()
            const endsAt = new Date()
            vi.mocked(db.quizzes.findAndCountAll).mockResolvedValue({
                count: 1,
                rows: [createMockInstance({ quizId: mockQuizId, selectedTags: [mockTagId], wordIds: [mockWordId, 'skipped'], completedAt, endsAt })],
            } as any)
            vi.mocked(db.sequelize.query).mockResolvedValue([{ quizId: mockQuizId, answered: 1, correctAnswers: 0 }] as any)

            const history = await getQuizHistory(mockUserId, 2, 5)

            expect(history.quizzes).toEqual([
                {
                    quizId: mockQuizId,
                    selectedTags: [mockTagId],
                    poolSize: 2,
                    answered: 1,
                    correctAnswers: 0,
                    completedAt,
                    endsAt,
                },
            ])
            expect(history.pagination).toEqual({ total: 1, page: 2, limit: 5, totalPages: 1 })
            expect(db.quizzes.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5, offset: 5 }))
        })
    })

    describe('completeExpiredQuizzes', () => {
        it('sets completedAt on quizzes whose endsAt has passed', async () => {
            await completeExpiredQuizzes()

            expect(db.quizzes.update).toHaveBeenCalledWith(
                { completedAt: expect.any(Date) },
                {
                    where: {
                        completedAt: null,
                        endsAt: expect.any(Object),
                    },
                },
            )
        })
    })
})
