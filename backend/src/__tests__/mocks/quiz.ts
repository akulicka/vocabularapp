import { vi } from 'vitest'
import { StartQuizRequest, SubmitQuizRequest, QuizData, QuizResult, QuizQuestion, WordResult } from '@types'

// Common quiz identifiers
export const mockQuizId = 'test-quiz-id'
export const mockQuestionId = 'test-question-id'
export const mockWordId = 'test-word-id'

// Quiz question mock
export const createMockQuizQuestion = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
    questionId: mockQuestionId,
    wordId: mockWordId,
    word: 'test',
    partOfSpeech: 'noun',
    question: 'What is the meaning of "test"?',
    options: ['option1', 'option2', 'option3', 'option4'],
    correctAnswer: 0,
    ...overrides,
})

// Word result mock
export const createMockWordResult = (overrides: Partial<WordResult> = {}): WordResult => ({
    wordId: mockWordId,
    word: 'test',
    correct: true,
    selectedAnswer: 0,
    correctAnswer: 0,
    timeSpent: 30,
    ...overrides,
})

// Quiz data mock
export const createMockQuizData = (overrides: Partial<QuizData> = {}): QuizData => ({
    quizId: mockQuizId,
    tokenId: 'test-token-id',
    questions: [createMockQuizQuestion()],
    totalQuestions: 1,
    timeLimit: 300,
    ...overrides,
})

// Quiz result mock
export const createMockQuizResult = (overrides: Partial<QuizResult> = {}): QuizResult & { save: any } => ({
    quizId: mockQuizId,
    userId: 'test-user-id',
    totalQuestions: 1,
    correctAnswers: 1,
    totalTime: 30,
    score: 100,
    completedAt: new Date(),
    wordResults: [createMockWordResult()],
    save: vi.fn().mockResolvedValue({}),
    ...overrides,
})

// Start quiz request mock
export const createMockStartQuizRequest = (overrides: Partial<StartQuizRequest> = {}): StartQuizRequest => ({
    selectedTags: ['tag1', 'tag2'],
    questionCount: 5,
    ...overrides,
})

// Submit quiz request mock
export const createMockSubmitQuizRequest = (overrides: Partial<SubmitQuizRequest> = {}): SubmitQuizRequest => ({
    quizId: mockQuizId,
    tokenId: 'test-token-id',
    answers: [
        {
            questionId: mockQuestionId,
            selectedAnswer: 0,
            timeSpent: 30,
        },
    ],
    timeSpent: 30,
    ...overrides,
})

// Word mock for database
export const createMockWord = (overrides = {}) => ({
    get: vi.fn().mockImplementation((key: string) => {
        const data = {
            wordId: mockWordId,
            english: 'test',
            arabic: 'اختبار',
            root: 'root',
            partOfSpeech: 'noun',
            noun: { meaning: 'A procedure for evaluation' },
            verb: null,
            ...overrides,
        }
        return data[key as keyof typeof data]
    }),
})

// Common quiz variations
export const mockQuizData = createMockQuizData()
export const mockQuizResult = createMockQuizResult()
export const mockStartQuizRequest = createMockStartQuizRequest()
export const mockSubmitQuizRequest = createMockSubmitQuizRequest()
