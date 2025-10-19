// Shared types for quiz-related DTOs
// Extracted from backend/src/types/quiz.ts

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

// Re-export types from schemas (generated from Zod schemas)
export type { StartQuizRequest, SubmitQuizRequest, QuizHistoryQuery } from '../schemas/quiz'
