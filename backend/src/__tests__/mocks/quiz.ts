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
    questions: [createMockQuizQuestion()],
    selectedTags: ['tag1', 'tag2'],
    totalQuestions: 1,
    startedAt: new Date(),
    ...overrides,
})

// Quiz result mock
export const createMockQuizResult = (overrides: Partial<QuizResult> = {}): QuizResult => ({
    quizId: mockQuizId,
    userId: 'test-user-id',
    totalQuestions: 1,
    correctAnswers: 1,
    score: 100,
    completedAt: new Date(),
    wordResults: [createMockWordResult()],
    ...overrides,
})

// Request mocks
export const createMockStartQuizRequest = (overrides: Partial<StartQuizRequest> = {}): StartQuizRequest => ({
    selectedTags: ['tag1', 'tag2'],
    ...overrides,
})

export const createMockSubmitQuizRequest = (overrides: Partial<SubmitQuizRequest> = {}): SubmitQuizRequest => ({
    quizId: mockQuizId,
    answers: [{ wordId: mockWordId, userAnswer: 'answer1', isCorrect: true }],
    timeSpent: 30,
    selectedTags: ['tag1'],
    ...overrides,
})

// Default request mocks
export const mockStartQuizRequest = createMockStartQuizRequest()
export const mockSubmitQuizRequest = createMockSubmitQuizRequest()
export const mockQuizData = createMockQuizData()
export const mockQuizResult = createMockQuizResult()
