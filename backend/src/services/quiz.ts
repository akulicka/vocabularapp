import { v4 as uuidv4 } from 'uuid'
import { Op, QueryTypes, UniqueConstraintError } from 'sequelize'
import db from '@db/models/index.js'
import { GradedAnswer, QuizDetail, QuizHistoryResponse, QuizTally, StartQuizRequest, StartedQuiz, SubmitAnswerRequest } from '@types'
import { withTransaction } from '@util/transaction.js'

const QUIZ_DURATION_MS = 2 * 60 * 1000
const QUIZ_WORD_LIMIT = 10

export class QuizError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'QuizError'
        this.status = status
    }
}

function readWordIds(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((id): id is string => typeof id === 'string')
}

function readCounts(row: { answered?: number | string | null; correctAnswers?: number | string | null } | undefined): { answered: number; correctAnswers: number } {
    return {
        answered: Number(row?.answered ?? 0),
        correctAnswers: Number(row?.correctAnswers ?? 0),
    }
}

async function answerCounts(quizIds: string[]): Promise<Map<string, { answered: number; correctAnswers: number }>> {
    const counts = new Map<string, { answered: number; correctAnswers: number }>()
    if (quizIds.length === 0) return counts

    const rows = await db.sequelize.query<{ quizId: string; answered: number | string; correctAnswers: number | string | null }>(
        `SELECT quizId, COUNT(wordId) AS answered, SUM(isCorrect) AS correctAnswers
         FROM answers
         WHERE quizId IN (:quizIds)
         GROUP BY quizId`,
        { replacements: { quizIds }, type: QueryTypes.SELECT },
    )

    for (const row of rows) {
        counts.set(row.quizId, readCounts(row))
    }
    return counts
}

async function pickWords(selectedTags: string[]): Promise<{ wordId: string; english: string }[]> {
    const words = await db.words.findAll({
        attributes: ['wordId', 'english'],
        include: [
            {
                model: db.tags,
                attributes: [],
                through: { attributes: [] },
                where: { tagId: selectedTags },
                required: true,
            },
        ],
        group: ['words.wordId', 'words.english'],
        order: db.sequelize.random(),
        limit: QUIZ_WORD_LIMIT,
        subQuery: false,
    })

    return words.map((word) => ({
        wordId: word.get('wordId'),
        english: word.get('english'),
    }))
}

export async function startQuiz(userId: string, request: StartQuizRequest): Promise<StartedQuiz> {
    const { selectedTags } = request

    if (!selectedTags || selectedTags.length === 0) {
        throw new QuizError('At least one tag must be selected', 400)
    }

    const words = await pickWords(selectedTags)
    if (words.length === 0) {
        throw new QuizError('No words found for selected tags', 400)
    }

    const quizId = uuidv4()
    const endsAt = new Date(Date.now() + QUIZ_DURATION_MS)

    await withTransaction(async (transaction) => {
        await db.quizzes.update({ completedAt: new Date() }, { where: { userId, completedAt: null }, transaction })
        await db.quizzes.create(
            {
                quizId,
                userId,
                selectedTags,
                wordIds: words.map((word) => word.wordId),
                endsAt,
                completedAt: null,
            },
            { transaction },
        )
    })

    return { quizId, endsAt, words }
}

export async function submitAnswer(userId: string, quizId: string, request: SubmitAnswerRequest): Promise<GradedAnswer> {
    const quiz = await db.quizzes.findOne({ where: { quizId, userId } })
    if (!quiz) throw new QuizError('Quiz not found', 404)
    if (quiz.completedAt) throw new QuizError('Quiz is already finished', 409)
    if (new Date() >= new Date(quiz.endsAt)) throw new QuizError('Quiz has ended', 400)

    const wordIds = readWordIds(quiz.wordIds)
    if (!wordIds.includes(request.wordId)) {
        throw new QuizError('Word is not in this quiz', 400)
    }

    const existing = await db.answers.findOne({ where: { quizId, wordId: request.wordId } })
    if (existing) throw new QuizError('Word already answered', 409)

    const word = await db.words.findOne({
        where: { wordId: request.wordId },
        attributes: ['root', 'arabic'],
    })
    if (!word) throw new QuizError('Word not found', 400)

    const userAnswer = request.userAnswer.trim()
    const root = word.get('root')
    const arabic = word.get('arabic')
    const isCorrect = userAnswer.toLowerCase() === (root?.toLowerCase() ?? '')

    try {
        await db.answers.create({
            quizId,
            wordId: request.wordId,
            userAnswer,
            isCorrect,
        })
    } catch (err) {
        if (err instanceof UniqueConstraintError) throw new QuizError('Word already answered', 409)
        throw err
    }

    return { isCorrect, userAnswer, root, arabic }
}

export async function finishQuiz(userId: string, quizId: string): Promise<QuizTally> {
    const quiz = await db.quizzes.findOne({ where: { quizId, userId } })
    if (!quiz) throw new QuizError('Quiz not found', 404)

    if (!quiz.completedAt) {
        quiz.completedAt = new Date()
        await quiz.save()
    }

    const counts = await answerCounts([quizId])
    const tally = counts.get(quizId) ?? { answered: 0, correctAnswers: 0 }

    return {
        quizId,
        poolSize: readWordIds(quiz.wordIds).length,
        answered: tally.answered,
        correctAnswers: tally.correctAnswers,
    }
}

export async function getQuiz(userId: string, quizId: string): Promise<QuizDetail | null> {
    const quiz = await db.quizzes.findOne({
        where: { quizId, userId },
        include: [
            {
                model: db.answers,
                as: 'answers',
                include: [
                    {
                        model: db.words,
                        as: 'word',
                        attributes: ['english', 'arabic', 'root'],
                    },
                ],
            },
        ],
    })
    if (!quiz) return null

    const data = quiz.get({ plain: true }) as {
        quizId: string
        userId: string
        selectedTags: string[] | null
        wordIds: unknown
        endsAt: Date
        completedAt: Date | null
        createdAt: Date
        updatedAt: Date
        answers?: Array<{
            wordId: string
            userAnswer: string
            isCorrect: boolean
            word?: { english: string; arabic: string; root: string | null }
        }>
    }

    return {
        quizId: data.quizId,
        userId: data.userId,
        selectedTags: data.selectedTags ?? null,
        wordIds: readWordIds(data.wordIds),
        endsAt: data.endsAt,
        completedAt: data.completedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        answers: (data.answers ?? []).map((answer) => ({
            wordId: answer.wordId,
            userAnswer: answer.userAnswer,
            isCorrect: Boolean(answer.isCorrect),
            english: answer.word?.english ?? '',
            arabic: answer.word?.arabic ?? '',
            root: answer.word?.root ?? null,
        })),
    }
}

export async function getQuizHistory(userId: string, page: number = 1, limit: number = 10): Promise<QuizHistoryResponse> {
    const offset = (page - 1) * limit

    const { count, rows } = await db.quizzes.findAndCountAll({
        where: {
            userId,
            completedAt: { [Op.ne]: null },
        },
        order: [['completedAt', 'DESC']],
        limit,
        offset,
    })

    const counts = await answerCounts(rows.map((quiz) => quiz.quizId))

    const quizzes = rows.map((quiz) => {
        const tally = counts.get(quiz.quizId) ?? { answered: 0, correctAnswers: 0 }
        return {
            quizId: quiz.quizId,
            selectedTags: quiz.selectedTags,
            poolSize: readWordIds(quiz.wordIds).length,
            answered: tally.answered,
            correctAnswers: tally.correctAnswers,
            completedAt: quiz.completedAt as Date,
            endsAt: quiz.endsAt,
        }
    })

    return {
        quizzes,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    }
}

export async function completeExpiredQuizzes(): Promise<void> {
    await db.quizzes.update(
        { completedAt: new Date() },
        {
            where: {
                completedAt: null,
                endsAt: { [Op.lt]: new Date() },
            },
        },
    )
}
