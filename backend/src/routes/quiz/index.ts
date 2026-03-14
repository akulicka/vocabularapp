import { Router, Response } from 'express'
import { verifycookie } from '@util/cookie'
import { validateBody, validateQuery } from '@/util/validation.js'
import { StartQuizRequestSchema, SubmitQuizRequestSchema, QuizHistoryQuerySchema } from '@shared/schemas'
import { StartQuizRequest, SubmitQuizRequest } from '@shared/types'
import { AuthenticatedRequest } from '@types'
import { startQuiz, submitQuiz, getQuizResult, getQuizHistory, cleanupExpiredQuizTokens } from '@/services/quiz'

const quiz_router = Router()

// Run cleanup every 5 minutes
setInterval(
    async () => {
        try {
            await cleanupExpiredQuizTokens()
            console.log('Quiz token cleanup completed')
        } catch (err: unknown) {
            console.log('Error cleaning up expired quiz tokens:', err instanceof Error ? err.message : 'Unknown error')
        }
    },
    5 * 60 * 1000,
)

// POST /quiz/start - Start a new quiz with selected tags
quiz_router.post('/start', [verifycookie, validateBody(StartQuizRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const request: StartQuizRequest = req.body

        const quizData = await startQuiz(userId, request)
        res.send(quizData)
    } catch (err: unknown) {
        console.log('Quiz start error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
})

// POST /quiz/submit - Submit quiz answers and get results
quiz_router.post('/submit', [verifycookie, validateBody(SubmitQuizRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const request: SubmitQuizRequest = req.body

        const result = await submitQuiz(userId, request)

        // Add additional fields for response
        const response = {
            ...result,
            score: Math.round((result.correctAnswers / result.totalQuestions) * 100),
            timeSpent: request.timeSpent,
        }

        res.send(response)
    } catch (err: unknown) {
        console.log('Quiz submit error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
})

// GET /quiz/results/:resultId - Get specific quiz result
quiz_router.get('/results/:resultId', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { resultId } = req.params

        const quizResult = await getQuizResult(resultId, userId)

        if (!quizResult) {
            return res.status(404).send({ error: 'Quiz result not found' })
        }

        res.send(quizResult)
        return
    } catch (err: unknown) {
        console.log('Quiz results error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
        return
    }
})

// GET /quiz/history - Get user's quiz history
quiz_router.get('/history', [verifycookie, validateQuery(QuizHistoryQuerySchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { page = 1, limit = 10 } = req.query
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : typeof page === 'number' ? page : 1
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : typeof limit === 'number' ? limit : 10

        const result = await getQuizHistory(userId, pageNum, limitNum)
        res.send(result)
    } catch (err: unknown) {
        console.log('Quiz history error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
})

export default quiz_router
