import { z } from 'zod'

export interface QuizQuestion {
    wordId: string
    english: string
    arabic: string
    root: string | null
    partOfSpeech: string | null
    noun?: any
    verb?: any
}

export interface QuizData {
    quizId: string
    questions: QuizQuestion[]
    selectedTags: string[]
    totalQuestions: number
    startedAt: Date
}

export interface QuizAnswer {
    wordId: string
    userAnswer: string
    isCorrect: boolean
    skipped?: boolean
}

export interface WordResult {
    wordId: string
    english: string
    arabic: string
    root: string | null
    correct: boolean
    userAnswer: string
    correctAnswer: string | null
    partOfSpeech: string | null
    skipped: boolean
    error?: string
}

export interface QuizResult {
    resultId: string
    userId: string
    selectedTags: string[]
    totalQuestions: number
    correctAnswers: number
    completedAt: Date
    wordResults: WordResult[]
    createdAt?: Date
    updatedAt?: Date
}

// Zod schemas for request validation
export const StartQuizRequestSchema = z.object({
    selectedTags: z.array(z.string().uuid('Invalid tag ID')).min(1, 'At least one tag must be selected'),
})

export const SubmitQuizRequestSchema = z.object({
    quizId: z.string().uuid('Invalid quiz ID'),
    answers: z
        .array(
            z.object({
                wordId: z.string().uuid('Invalid word ID'),
                userAnswer: z.string(),
                isCorrect: z.boolean(),
                skipped: z.boolean().optional(),
            }),
        )
        .min(1, 'At least one answer is required'),
    timeSpent: z.number().min(0, 'Time spent cannot be negative'),
    selectedTags: z.array(z.string().uuid('Invalid tag ID')),
})

export const QuizHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional(),
})

// Generate types from schemas
export type StartQuizRequest = z.infer<typeof StartQuizRequestSchema>
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequestSchema>
export type QuizHistoryQuery = z.infer<typeof QuizHistoryQuerySchema>
