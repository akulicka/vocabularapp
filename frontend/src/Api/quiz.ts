import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import request from './request'
import { validate } from './validation'

import { Dashboard, GradedAnswer, QuizHistoryQuery, QuizHistoryResponse, QuizTally, StartedQuiz, SubmitAnswerRequest } from '@vocabularapp/shared-types/types'
import { QuizHistoryQuerySchema, StartQuizRequestSchema, SubmitAnswerRequestSchema } from '@vocabularapp/shared-types/schemas'

export const quizApi = {
    startQuiz: async (selectedTags: unknown): Promise<StartedQuiz> => {
        const validation = validate(StartQuizRequestSchema, { selectedTags })
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post('/quiz/start', validation.data)
        return response.data
    },

    submitAnswer: async (quizId: string, answer: unknown): Promise<GradedAnswer> => {
        const validation = validate(SubmitAnswerRequestSchema, answer)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post(`/quiz/${quizId}/answers`, validation.data)
        return response.data
    },

    finishQuiz: async (quizId: string): Promise<QuizTally> => {
        const response = await request.post(`/quiz/${quizId}/finish`)
        return response.data
    },

    getDashboard: async (): Promise<Dashboard> => {
        const response = await request.get('/user/dashboard')
        return response.data
    },

    getUserQuizHistory: async (query?: QuizHistoryQuery): Promise<QuizHistoryResponse> => {
        if (query) {
            const validation = validate(QuizHistoryQuerySchema, query)
            if (!validation.isValid) {
                throw new Error(validation.errors?.[0] || 'Validation failed')
            }
            query = validation.data
        }
        const response = await request.get('/quiz/history', {
            params: query,
        })
        return response.data
    },
}

export const useStartQuiz = (userId: string) => {
    const queryClient = useQueryClient()

    return useMutation<StartedQuiz, Error, unknown>({
        mutationFn: quizApi.startQuiz,
        onSuccess: (data) => {
            queryClient.setQueryData(['quiz', userId, data.quizId], data)
        },
    })
}

export const useSubmitAnswer = () => {
    return useMutation<GradedAnswer, Error, { quizId: string } & SubmitAnswerRequest>({
        mutationFn: ({ quizId, wordId, userAnswer }) => quizApi.submitAnswer(quizId, { wordId, userAnswer }),
    })
}

export const useFinishQuiz = (userId: string) => {
    const queryClient = useQueryClient()

    return useMutation<QuizTally, Error, string>({
        mutationFn: quizApi.finishQuiz,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quiz', userId, 'history'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
            queryClient.setQueryData(['quiz', userId, data.quizId], data)
        },
    })
}

export const useDashboard = (userId: string) => {
    return useQuery<Dashboard>({
        queryKey: ['dashboard', userId],
        queryFn: quizApi.getDashboard,
        enabled: Boolean(userId),
    })
}

export const useQuizHistory = (userId: string, query?: QuizHistoryQuery) => {
    return useQuery<QuizHistoryResponse>({
        queryKey: ['quiz', userId, 'history', query],
        queryFn: () => quizApi.getUserQuizHistory(query),
        enabled: Boolean(userId),
    })
}
