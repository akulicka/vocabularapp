import { Router, Response } from 'express'
import { verifycookie } from '@util/cookie.js'
import { validateBody, validateParams, validateQuery } from '@/util/validation.js'
import { QuizHistoryQuerySchema, QuizIdParamsSchema, StartQuizRequestSchema, SubmitAnswerRequestSchema } from '@vocabularapp/shared-types/schemas'
import { StartQuizRequest, SubmitAnswerRequest } from '@vocabularapp/shared-types/types'
import { AuthenticatedRequest } from '@types'
import { completeExpiredQuizzes, finishQuiz, getQuiz, getQuizHistory, QuizError, startQuiz, submitAnswer } from '@/services/quiz.js'

const quiz_router = Router()

setInterval(
    async () => {
        try {
            await completeExpiredQuizzes()
            console.log('Expired quiz cleanup completed')
        } catch (err: unknown) {
            console.log('Error completing expired quizzes:', err instanceof Error ? err.message : 'Unknown error')
        }
    },
    5 * 60 * 1000,
)

function sendQuizError(res: Response, err: unknown, label: string): void {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.log(label, message)
    const status = err instanceof QuizError ? err.status : 500
    res.status(status).send({ error: message })
}

// POST /quiz/start - Start a new quiz with selected tags
quiz_router.post('/start', [verifycookie, validateBody(StartQuizRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const request: StartQuizRequest = req.body
        const quiz = await startQuiz(userId, request)
        res.send(quiz)
    } catch (err: unknown) {
        sendQuizError(res, err, 'Quiz start error:')
    }
})

// POST /quiz/:quizId/answers - Grade and store one answer
quiz_router.post('/:quizId/answers', [verifycookie, validateParams(QuizIdParamsSchema), validateBody(SubmitAnswerRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { quizId } = req.params
        const request: SubmitAnswerRequest = req.body
        const graded = await submitAnswer(userId, quizId, request)
        res.send(graded)
    } catch (err: unknown) {
        sendQuizError(res, err, 'Quiz answer error:')
    }
})

// POST /quiz/:quizId/finish - Close the quiz and return the tally
quiz_router.post('/:quizId/finish', [verifycookie, validateParams(QuizIdParamsSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { quizId } = req.params
        const tally = await finishQuiz(userId, quizId)
        res.send(tally)
    } catch (err: unknown) {
        sendQuizError(res, err, 'Quiz finish error:')
    }
})

// GET /quiz/history - Finished quizzes for this user
quiz_router.get('/history', [verifycookie, validateQuery(QuizHistoryQuerySchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { page = 1, limit = 10 } = req.query
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : typeof page === 'number' ? page : 1
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : typeof limit === 'number' ? limit : 10
        const result = await getQuizHistory(userId, pageNum, limitNum)
        res.send(result)
    } catch (err: unknown) {
        sendQuizError(res, err, 'Quiz history error:')
    }
})

// GET /quiz/:quizId - One quiz and its saved answers
quiz_router.get('/:quizId', [verifycookie, validateParams(QuizIdParamsSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { quizId } = req.params
        const quiz = await getQuiz(userId, quizId)
        if (!quiz) {
            res.status(404).send({ error: 'Quiz not found' })
            return
        }
        res.send(quiz)
    } catch (err: unknown) {
        sendQuizError(res, err, 'Quiz read error:')
    }
})

export default quiz_router
