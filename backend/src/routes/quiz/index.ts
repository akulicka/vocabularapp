import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { verifycookie } from '@util/cookie'
import { validateBody, validateQuery, validateParams } from '@/util/validation.js'
import db from '@db/models/index.js'
import { StartQuizRequestSchema, SubmitQuizRequestSchema, QuizHistoryQuerySchema } from '@shared/schemas'
import { QuizQuestion, QuizData, QuizAnswer, WordResult, QuizResult, StartQuizRequest, SubmitQuizRequest, QuizHistoryQuery } from '@shared/types'
import { AuthenticatedRequest } from '@types'
import { getWordsByTags } from '@/services/word'
import { Op } from 'sequelize'

const quiz_router = Router()

// Cleanup expired quiz tokens (run periodically)
const cleanupExpiredQuizTokens = async (): Promise<void> => {
    try {
        const QUIZ_TIMEOUT_MINUTES = 10 // Quiz expires after 10 minutes
        const cutoffTime = new Date(Date.now() - QUIZ_TIMEOUT_MINUTES * 60 * 1000)

        const deletedCount = await db.tokens.destroy({
            where: {
                tokenClass: 'QUIZ',
                createdAt: {
                    [Op.lt]: cutoffTime,
                },
            },
        })

        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired quiz tokens`)
        }
    } catch (err: unknown) {
        console.log('Error cleaning up expired quiz tokens:', err instanceof Error ? err.message : 'Unknown error')
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredQuizTokens, 5 * 60 * 1000)

// POST /quiz/start - Start a new quiz with selected tags
quiz_router.post('/start', [verifycookie, validateBody(StartQuizRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { selectedTags } = req.body

        if (!selectedTags || selectedTags.length === 0) {
            return res.status(400).send({ error: 'At least one tag must be selected' })
        }

        // Clean up any existing quiz tokens for this user
        await db.tokens.destroy({
            where: { userId, tokenClass: 'QUIZ' },
        })

        // Use word service to get words that match the selected tags
        const words = await getWordsByTags(selectedTags, 10)
        console.log('Words:', words)
        if (words.length === 0) {
            return res.status(400).send({ error: 'No words found for selected tags' })
        }

        // Generate quiz questions
        const questions = words.map((word) => ({
            wordId: word.wordId,
            english: word.english,
            arabic: word.arabic,
            root: word.root, // Include root field for user input
            partOfSpeech: word.partOfSpeech,
            // Include additional properties based on part of speech
            ...((word as any).noun && { noun: (word as any).noun }),
            ...((word as any).verb && { verb: (word as any).verb }),
        }))

        // Generate unique quiz ID
        const quizId = uuidv4()

        // Create quiz data
        const quizData = {
            quizId,
            questions,
            selectedTags,
            totalQuestions: questions.length,
            startedAt: new Date(),
        }

        // Store quiz session in tokens table
        await db.tokens.create({
            tokenId: quizId,
            userId,
            tokenClass: 'QUIZ',
            payload: quizData,
        })

        res.send(quizData)
        return
    } catch (err: unknown) {
        console.log('Quiz start error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
        return
    }
})

// POST /quiz/submit - Submit quiz answers and get results
quiz_router.post('/submit', [verifycookie, validateBody(SubmitQuizRequestSchema)], async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('Quiz submit route hit')
        const { userId } = req.query.user
        const { quizId, answers, timeSpent } = req.body

        console.log('Quiz submit data:', { quizId, answers, timeSpent })

        if (!quizId || !answers || !Array.isArray(answers)) {
            return res.status(400).send({ error: 'Invalid quiz data provided' })
        }

        // Get quiz from token
        const token = await db.tokens.findOne({
            where: {
                tokenId: quizId,
                userId,
                tokenClass: 'QUIZ',
            },
        })

        console.log('Quiz token:', token)

        if (!token) {
            return res.status(404).send({ error: 'Quiz session not found or expired' })
        }
        console.log('Quiz token.quizData:', token.payload)

        // Get quiz data from token (now stored as JSON)
        const quizData = token.payload
        console.log('Quiz data:', quizData)
        const { selectedTags } = quizData

        // Get the words for this quiz to validate answers
        const wordIds = answers.map((answer) => answer.wordId)
        const words = await db.words.findAll({
            where: { wordId: wordIds },
            include: [{ model: db.tags, through: { attributes: [] } }, { model: db.nouns }, { model: db.verbs }],
        })

        // Create a map for quick lookup
        const wordMap = new Map(words.map((word) => [word.wordId, word]))

        // Calculate results
        let correctAnswers = 0
        const wordResults: WordResult[] = []

        answers.forEach((answer) => {
            const word = wordMap.get(answer.wordId)
            if (!word) {
                wordResults.push({
                    wordId: answer.wordId,
                    english: '',
                    arabic: '',
                    root: null,
                    correct: false,
                    userAnswer: answer.userAnswer,
                    correctAnswer: null,
                    partOfSpeech: null,
                    skipped: false,
                    error: 'Word not found',
                })
                return
            }

            // Use the isCorrect field from the frontend instead of recalculating
            const isCorrect = answer.isCorrect || false

            if (isCorrect) {
                correctAnswers++
            }

            wordResults.push({
                wordId: word.wordId,
                english: word.english,
                arabic: word.arabic,
                root: word.root,
                correct: isCorrect,
                userAnswer: answer.userAnswer,
                correctAnswer: word.root,
                partOfSpeech: word.partOfSpeech,
                skipped: answer.skipped || false,
            })
        })

        // Save quiz result to database
        const resultId = uuidv4()
        const quizResult = await db.quizResults.create({
            resultId,
            userId,
            selectedTags,
            totalQuestions: answers.length,
            correctAnswers,
            completedAt: new Date(),
            wordResults,
        })

        // Clean up the quiz token
        await token.destroy()

        const result = {
            resultId,
            quizId,
            totalQuestions: answers.length,
            correctAnswers,
            score: Math.round((correctAnswers / answers.length) * 100),
            timeSpent,
            completedAt: quizResult.completedAt,
            wordResults,
        }

        res.send(result)
        return
    } catch (err: unknown) {
        console.log('Quiz submit error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
        return
    }
})

// GET /quiz/results/:resultId - Get specific quiz result
quiz_router.get('/results/:resultId', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { resultId } = req.params

        const quizResult = await db.quizResults.findOne({
            where: {
                resultId,
                userId, // Ensure user can only access their own results
            },
        })

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
        const offset = (pageNum - 1) * limitNum

        const { count, rows: quizResults } = await db.quizResults.findAndCountAll({
            where: { userId },
            order: [['completedAt', 'DESC']],
            limit: limitNum,
            offset: offset,
            attributes: ['resultId', 'selectedTags', 'totalQuestions', 'correctAnswers', 'completedAt'],
        })

        const result = {
            quizResults,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum),
            },
        }

        res.send(result)
        return
    } catch (err: unknown) {
        console.log('Quiz history error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
})

export default quiz_router
