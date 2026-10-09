import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDashboard } from '@services/dashboard.js'
import db from '@db/models/index.js'
import { mockUserId } from '../mocks/users.js'

vi.mock('@db/models/index.js', () => ({
    default: {
        sequelize: { query: vi.fn() },
    },
}))

function mockDashboardQueries(tables: { summary?: unknown[]; quizzes?: unknown[]; words?: unknown[]; tags?: unknown[] }) {
    vi.mocked(db.sequelize.query).mockImplementation((sql: unknown) => {
        const text = String(sql)
        if (text.includes('wordsStudied')) return Promise.resolve(tables.summary ?? []) as never
        if (text.includes('tagwords')) return Promise.resolve(tables.tags ?? []) as never
        if (text.includes('w.arabic')) return Promise.resolve(tables.words ?? []) as never
        if (text.includes('q.wordIds')) return Promise.resolve(tables.quizzes ?? []) as never
        return Promise.reject(new Error(`unexpected query: ${text}`))
    })
}

function queryText(fragment: string): string {
    const sql = vi
        .mocked(db.sequelize.query)
        .mock.calls.map((call) => String(call[0]))
        .find((text) => text.includes(fragment))
    if (!sql) throw new Error(`missing query: ${fragment}`)
    return sql
}

describe('Dashboard Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('maps summary totals, with quizCount limited to finished quizzes', async () => {
        mockDashboardQueries({
            summary: [{ quizCount: '2', correct: '7', attempts: '10', wordsStudied: '4' }],
        })

        const dashboard = await getDashboard(mockUserId)

        expect(dashboard.summary).toEqual({ quizCount: 2, correct: 7, attempts: 10, wordsStudied: 4 })
        const summarySql = queryText('wordsStudied')
        expect(summarySql).toContain('completedAt IS NOT NULL')
        expect(summarySql).toContain('COUNT(DISTINCT a.wordId) AS wordsStudied')
        for (const call of vi.mocked(db.sequelize.query).mock.calls) {
            expect(call[1]).toMatchObject({ replacements: { userId: mockUserId } })
        }
    })

    it('keeps the newest finished quizzes in query order, capped at 10', async () => {
        const newest = new Date('2026-03-02T00:00:00.000Z')
        const older = new Date('2026-01-01T00:00:00.000Z')
        mockDashboardQueries({
            quizzes: [
                { quizId: 'newest', completedAt: newest, wordIds: ['a', 'b', 3], correctAnswers: '1' },
                { quizId: 'older', completedAt: older, wordIds: '["a","b","c"]', correctAnswers: 0 },
            ],
        })

        const dashboard = await getDashboard(mockUserId)

        expect(dashboard.quizzes).toEqual([
            { quizId: 'newest', completedAt: newest.toISOString(), correctAnswers: 1, poolSize: 2 },
            { quizId: 'older', completedAt: older.toISOString(), correctAnswers: 0, poolSize: 3 },
        ])
        const quizSql = queryText('q.wordIds')
        expect(quizSql).toContain('ORDER BY q.completedAt DESC')
        expect(quizSql).toContain('LIMIT 10')
        expect(quizSql).toContain('completedAt IS NOT NULL')
    })

    it('maps word rates from answered words', async () => {
        mockDashboardQueries({
            words: [
                { wordId: 'owl', arabic: 'بُوم', english: 'owl', correct: '1', attempts: '2' },
                { wordId: 'cat', arabic: 'قِطّ', english: 'cat', correct: 3, attempts: 3 },
            ],
        })

        const dashboard = await getDashboard(mockUserId)

        expect(dashboard.words).toEqual([
            { wordId: 'owl', arabic: 'بُوم', english: 'owl', correct: 1, attempts: 2 },
            { wordId: 'cat', arabic: 'قِطّ', english: 'cat', correct: 3, attempts: 3 },
        ])
    })

    it('counts a word on each of its tags', async () => {
        mockDashboardQueries({
            tags: [
                { tagId: 'animals', tagName: 'animals', correct: '1', attempts: '2' },
                { tagId: 'birds', tagName: 'birds', correct: '1', attempts: '2' },
            ],
        })

        const dashboard = await getDashboard(mockUserId)

        expect(dashboard.tags).toEqual([
            { tagId: 'animals', tagName: 'animals', correct: 1, attempts: 2 },
            { tagId: 'birds', tagName: 'birds', correct: 1, attempts: 2 },
        ])
        const tagSql = queryText('tagwords')
        expect(tagSql).toContain('INNER JOIN tagwords')
        expect(tagSql).not.toContain('selectedTags')
    })

    it('returns zeros and empty lists when the user has no activity', async () => {
        mockDashboardQueries({
            summary: [{ quizCount: 0, correct: null, attempts: 0, wordsStudied: 0 }],
        })

        const dashboard = await getDashboard(mockUserId)

        expect(dashboard).toEqual({
            summary: { quizCount: 0, correct: 0, attempts: 0, wordsStudied: 0 },
            quizzes: [],
            words: [],
            tags: [],
        })
    })
})
