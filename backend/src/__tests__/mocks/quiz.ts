import { GradedAnswer, QuizTally, StartedQuiz, StartQuizRequest, SubmitAnswerRequest } from '@types'

export const mockQuizId = '660e8400-e29b-41d4-a716-446655440000'
export const mockWordId = '770e8400-e29b-41d4-a716-446655440000'
export const mockTagId = '880e8400-e29b-41d4-a716-446655440000'

export const createMockStartQuizRequest = (overrides: Partial<StartQuizRequest> = {}): StartQuizRequest => ({
    selectedTags: [mockTagId],
    ...overrides,
})

export const createMockSubmitAnswerRequest = (overrides: Partial<SubmitAnswerRequest> = {}): SubmitAnswerRequest => ({
    wordId: mockWordId,
    userAnswer: 'owl',
    ...overrides,
})

export const createMockStartedQuiz = (overrides: Partial<StartedQuiz> = {}): StartedQuiz => ({
    quizId: mockQuizId,
    endsAt: new Date(Date.now() + 120000),
    words: [{ wordId: mockWordId, english: 'owl' }],
    ...overrides,
})

export const createMockGradedAnswer = (overrides: Partial<GradedAnswer> = {}): GradedAnswer => ({
    isCorrect: true,
    userAnswer: 'owl',
    root: 'owl',
    arabic: 'بُوم',
    ...overrides,
})

export const createMockQuizTally = (overrides: Partial<QuizTally> = {}): QuizTally => ({
    quizId: mockQuizId,
    poolSize: 1,
    answered: 1,
    correctAnswers: 1,
    ...overrides,
})

export const mockStartQuizRequest = createMockStartQuizRequest()
export const mockSubmitAnswerRequest = createMockSubmitAnswerRequest()
export const mockStartedQuiz = createMockStartedQuiz()
export const mockGradedAnswer = createMockGradedAnswer()
export const mockQuizTally = createMockQuizTally()
