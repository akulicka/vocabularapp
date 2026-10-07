import { z } from 'zod'

export interface QuizPrompt {
    wordId: string
    english: string
}

export interface StartedQuiz {
    quizId: string
    endsAt: Date
    words: QuizPrompt[]
}

export interface GradedAnswer {
    isCorrect: boolean
    userAnswer: string
    root: string | null
    arabic: string
}

export interface QuizTally {
    quizId: string
    poolSize: number
    answered: number
    correctAnswers: number
}

export interface QuizHistoryItem extends QuizTally {
    selectedTags: string[] | null
    completedAt: Date
    endsAt: Date
}

export interface QuizHistoryResponse {
    quizzes: QuizHistoryItem[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface QuizAnswerDetail {
    wordId: string
    userAnswer: string
    isCorrect: boolean
    english: string
    arabic: string
    root: string | null
}

export interface QuizDetail {
    quizId: string
    userId: string
    selectedTags: string[] | null
    wordIds: string[]
    endsAt: Date
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    answers: QuizAnswerDetail[]
}

export const StartQuizRequestSchema = z.object({
    selectedTags: z.array(z.string().uuid('Invalid tag ID')).min(1, 'At least one tag must be selected'),
})

export const SubmitAnswerRequestSchema = z.object({
    wordId: z.string().uuid('Invalid word ID'),
    userAnswer: z.string().max(255, 'Answer is too long'),
})

export const QuizIdParamsSchema = z.object({
    quizId: z.string().uuid('Invalid quiz ID'),
})

export const QuizHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional(),
})

export type StartQuizRequest = z.infer<typeof StartQuizRequestSchema>
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>
export type QuizIdParams = z.infer<typeof QuizIdParamsSchema>
export type QuizHistoryQuery = z.infer<typeof QuizHistoryQuerySchema>
