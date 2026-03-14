import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import { QuizData, QuizQuestion, QuizAnswer, WordResult, QuizResult, StartQuizRequest, SubmitQuizRequest, VERIFY_TOKEN_CLASS, QUIZ_TOKEN_CLASS, TokenUser } from '@types'
import { Op } from 'sequelize'

export async function createQuizToken(userId: string): Promise<string> {
    const tokenId = uuidv4()
    const token = await db.tokens.build({
        tokenId,
        userId,
        tokenClass: QUIZ_TOKEN_CLASS,
    })
    await token.save()
    return tokenId
}

export async function validateQuizToken(tokenId: string, userId: string): Promise<boolean> {
    const QUIZ_TIMEOUT_MINUTES = 10
    const cutoffTime = new Date(Date.now() - QUIZ_TIMEOUT_MINUTES * 60 * 1000)

    const token = await db.tokens.findOne({
        where: {
            tokenId,
            userId,
            tokenClass: QUIZ_TOKEN_CLASS,
            createdAt: {
                [Op.gt]: cutoffTime,
            },
        },
    })

    return !!token
}

export async function startQuiz(userId: string, request: StartQuizRequest): Promise<QuizData> {
    const { selectedTags } = request

    if (!selectedTags || selectedTags.length === 0) {
        throw new Error('At least one tag must be selected')
    }

    // Clean up any existing quiz tokens for this user
    await db.tokens.destroy({
        where: { userId, tokenClass: QUIZ_TOKEN_CLASS },
    })

    // Get words with selected tags
    const words = await db.words.findAll({
        include: [
            { model: db.nouns, required: false },
            { model: db.verbs, required: false },
            {
                model: db.tags,
                through: { attributes: [] },
                where: { tagId: selectedTags },
            },
        ],
        limit: 10,
    })

    if (words.length === 0) {
        throw new Error('No words found for selected tags')
    }

    const questions: QuizQuestion[] = words.map((word) => ({
        wordId: word.get('wordId'),
        english: word.get('english'),
        arabic: word.get('arabic'),
        root: word.get('root'),
        partOfSpeech: word.get('partOfSpeech'),
        noun: word.get('noun'),
        verb: word.get('verb'),
    }))

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
        tokenClass: QUIZ_TOKEN_CLASS,
        payload: quizData,
    })

    return quizData
}

export async function submitQuiz(userId: string, request: SubmitQuizRequest): Promise<QuizResult> {
    const { quizId, answers, timeSpent } = request

    // Get quiz token to retrieve selectedTags
    const token = await db.tokens.findOne({
        where: {
            tokenId: quizId,
            userId,
            tokenClass: QUIZ_TOKEN_CLASS,
        },
    })

    if (!token) {
        throw new Error('Quiz session not found or expired')
    }

    const quizData = token.payload as any
    const selectedTags = quizData?.selectedTags || []

    // Process answers and calculate results
    const wordResults: WordResult[] = []
    let correctAnswers = 0

    for (const answer of answers) {
        const word = await db.words.findOne({ where: { wordId: answer.wordId } })
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
                skipped: answer.skipped || false,
                error: 'Word not found',
            })
            continue
        }

        // Use the isCorrect field from the frontend instead of recalculating
        const isCorrect = answer.isCorrect || false

        if (isCorrect) correctAnswers++

        wordResults.push({
            wordId: answer.wordId,
            english: word.get('english'),
            arabic: word.get('arabic'),
            root: word.get('root'),
            correct: isCorrect,
            userAnswer: answer.userAnswer,
            correctAnswer: word.get('root'),
            partOfSpeech: word.get('partOfSpeech'),
            skipped: answer.skipped || false,
        })
    }

    const resultId = uuidv4()

    // Save quiz result to database
    const quizResult = await db.quizResults.build({
        resultId,
        userId,
        selectedTags,
        totalQuestions: answers.length,
        correctAnswers,
        completedAt: new Date(),
        wordResults: JSON.stringify(wordResults),
    })

    await quizResult.save()

    // Clean up the quiz token
    await token.destroy()

    return {
        resultId,
        userId,
        selectedTags,
        totalQuestions: answers.length,
        correctAnswers,
        completedAt: new Date(),
        wordResults,
    }
}

export async function getQuizResult(resultId: string, userId: string): Promise<QuizResult | null> {
    const result = await db.quizResults.findOne({
        where: { resultId, userId },
    })

    if (!result) return null

    return {
        resultId: result.get('resultId') as string,
        userId: result.get('userId') as string,
        selectedTags: result.get('selectedTags') as string[],
        totalQuestions: result.get('totalQuestions') as number,
        correctAnswers: result.get('correctAnswers') as number,
        completedAt: result.get('completedAt') as Date,
        wordResults: JSON.parse(result.get('wordResults') as string),
        createdAt: result.get('createdAt') as Date,
        updatedAt: result.get('updatedAt') as Date,
    }
}

export async function getQuizHistory(userId: string, page: number = 1, limit: number = 10): Promise<{ quizResults: QuizResult[]; pagination: any }> {
    const offset = (page - 1) * limit

    const { count, rows: results } = await db.quizResults.findAndCountAll({
        where: { userId },
        order: [['completedAt', 'DESC']],
        limit,
        offset,
        attributes: ['resultId', 'selectedTags', 'totalQuestions', 'correctAnswers', 'completedAt'],
    })

    const quizResults = results.map((result) => ({
        resultId: result.get('resultId') as string,
        userId: result.get('userId') as string,
        selectedTags: result.get('selectedTags') as string[],
        totalQuestions: result.get('totalQuestions') as number,
        correctAnswers: result.get('correctAnswers') as number,
        completedAt: result.get('completedAt') as Date,
        wordResults: JSON.parse(result.get('wordResults') as string),
        createdAt: result.get('createdAt') as Date,
        updatedAt: result.get('updatedAt') as Date,
    }))

    return {
        quizResults,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    }
}

export async function cleanupExpiredQuizTokens(): Promise<void> {
    const QUIZ_TIMEOUT_MINUTES = 10
    const cutoffTime = new Date(Date.now() - QUIZ_TIMEOUT_MINUTES * 60 * 1000)

    await db.tokens.destroy({
        where: {
            tokenClass: QUIZ_TOKEN_CLASS,
            createdAt: {
                [Op.lt]: cutoffTime,
            },
        },
    })
}
