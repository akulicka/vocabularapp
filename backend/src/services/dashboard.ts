import { QueryTypes } from 'sequelize'
import db from '@db/models/index.js'
import { Dashboard } from '@vocabularapp/shared-types/types'

const RECENT_QUIZ_LIMIT = 10

function readNumber(value: number | string | bigint | null | undefined): number {
    return Number(value ?? 0)
}

function toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function poolSize(value: unknown): number {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value)
        } catch {
            return 0
        }
    }
    if (!Array.isArray(value)) return 0
    return value.filter((id) => typeof id === 'string').length
}

// quizCount is finished quizzes. The other totals include answers on an open quiz.
async function dashboardSummary(userId: string): Promise<Dashboard['summary']> {
    const rows = await db.sequelize.query<{
        quizCount: number | string | null
        correct: number | string | null
        attempts: number | string | null
        wordsStudied: number | string | null
    }>(
        `SELECT
            (SELECT COUNT(*) FROM quizzes WHERE userId = :userId AND completedAt IS NOT NULL) AS quizCount,
            COUNT(a.wordId) AS attempts,
            COALESCE(SUM(a.isCorrect), 0) AS correct,
            COUNT(DISTINCT a.wordId) AS wordsStudied
         FROM answers a
         INNER JOIN quizzes q ON q.quizId = a.quizId
         WHERE q.userId = :userId`,
        { replacements: { userId }, type: QueryTypes.SELECT },
    )

    const summary = rows[0]
    return {
        quizCount: readNumber(summary?.quizCount),
        correct: readNumber(summary?.correct),
        attempts: readNumber(summary?.attempts),
        wordsStudied: readNumber(summary?.wordsStudied),
    }
}

// poolSize is the wordIds length, so unanswered words stay in the denominator.
async function recentQuizzes(userId: string): Promise<Dashboard['quizzes']> {
    const rows = await db.sequelize.query<{
        quizId: string
        completedAt: Date | string
        wordIds: unknown
        correctAnswers: number | string | null
    }>(
        `SELECT q.quizId, q.completedAt, q.wordIds, COALESCE(SUM(a.isCorrect), 0) AS correctAnswers
         FROM quizzes q
         LEFT JOIN answers a ON a.quizId = q.quizId
         WHERE q.userId = :userId AND q.completedAt IS NOT NULL
         GROUP BY q.quizId, q.completedAt, q.wordIds
         ORDER BY q.completedAt DESC
         LIMIT ${RECENT_QUIZ_LIMIT}`,
        { replacements: { userId }, type: QueryTypes.SELECT },
    )

    return rows.map((row) => ({
        quizId: row.quizId,
        completedAt: toIsoString(row.completedAt),
        correctAnswers: readNumber(row.correctAnswers),
        poolSize: poolSize(row.wordIds),
    }))
}

async function wordRates(userId: string): Promise<Dashboard['words']> {
    const rows = await db.sequelize.query<{
        wordId: string
        arabic: string
        english: string
        correct: number | string | null
        attempts: number | string | null
    }>(
        `SELECT w.wordId, w.arabic, w.english,
                COUNT(*) AS attempts,
                COALESCE(SUM(a.isCorrect), 0) AS correct
         FROM answers a
         INNER JOIN quizzes q ON q.quizId = a.quizId
         INNER JOIN words w ON w.wordId = a.wordId
         WHERE q.userId = :userId
         GROUP BY w.wordId, w.arabic, w.english`,
        { replacements: { userId }, type: QueryTypes.SELECT },
    )

    return rows.map((row) => ({
        wordId: row.wordId,
        arabic: row.arabic,
        english: row.english,
        correct: readNumber(row.correct),
        attempts: readNumber(row.attempts),
    }))
}

// One answer counts on every tag the word has.
async function tagRates(userId: string): Promise<Dashboard['tags']> {
    const rows = await db.sequelize.query<{
        tagId: string
        tagName: string
        correct: number | string | null
        attempts: number | string | null
    }>(
        `SELECT t.tagId, t.tagName,
                COUNT(*) AS attempts,
                COALESCE(SUM(a.isCorrect), 0) AS correct
         FROM answers a
         INNER JOIN quizzes q ON q.quizId = a.quizId
         INNER JOIN tagwords tw ON tw.wordId = a.wordId
         INNER JOIN tags t ON t.tagId = tw.tagId
         WHERE q.userId = :userId
         GROUP BY t.tagId, t.tagName`,
        { replacements: { userId }, type: QueryTypes.SELECT },
    )

    return rows.map((row) => ({
        tagId: row.tagId,
        tagName: row.tagName,
        correct: readNumber(row.correct),
        attempts: readNumber(row.attempts),
    }))
}

export async function getDashboard(userId: string): Promise<Omit<Dashboard, 'user'>> {
    const [summary, quizzes, words, tags] = await Promise.all([dashboardSummary(userId), recentQuizzes(userId), wordRates(userId), tagRates(userId)])

    return { summary, quizzes, words, tags }
}
