import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from './request'
import { validate } from './validation'

// Import types and schemas from shared
import {
    QuizData,
    QuizResult,
    // StartQuizRequest,
    // SubmitQuizRequest,
    QuizHistoryQuery,
} from '@vocabularapp/shared-types/dist/types'
import { StartQuizRequestSchema, SubmitQuizRequestSchema, QuizHistoryQuerySchema } from '@vocabularapp/shared-types/dist/schemas'

// Quiz API functions with validation
export const quizApi = {
    startQuiz: async (selectedTags: unknown): Promise<QuizData> => {
        // Validate input data before sending
        const validation = validate(StartQuizRequestSchema, { selectedTags })
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post('/quiz/start', validation.data)
        return response.data
    },

    submitQuiz: async (quizData: unknown): Promise<QuizResult> => {
        // Validate input data before sending
        const validation = validate(SubmitQuizRequestSchema, quizData)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post('/quiz/submit', validation.data)
        return response.data
    },

    getQuizResults: async (resultId: string): Promise<QuizResult> => {
        const response = await request.get(`/quiz/results/${resultId}`)
        return response.data
    },

    getUserQuizHistory: async (
        query?: QuizHistoryQuery,
    ): Promise<{
        quizResults: QuizResult[]
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }> => {
        // Validate query parameters if provided
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

// React Query hooks with proper typing
export const useStartQuiz = () => {
    const queryClient = useQueryClient()

    return useMutation<QuizData, Error, unknown>({
        mutationFn: quizApi.startQuiz,
        onSuccess: (data) => {
            // Cache the quiz data
            queryClient.setQueryData(['quiz', data.quizId], data)
        },
    })
}

export const useSubmitQuiz = () => {
    const queryClient = useQueryClient()

    return useMutation<QuizResult, Error, unknown>({
        mutationFn: quizApi.submitQuiz,
        onSuccess: (data) => {
            // Invalidate and refetch quiz history
            queryClient.invalidateQueries({ queryKey: ['quiz', 'history'] })
            // Cache the result
            queryClient.setQueryData(['quiz', 'result', data.resultId], data)
        },
    })
}

export const useQuizResults = (resultId: string | undefined) => {
    return useQuery<QuizResult>({
        queryKey: ['quiz', 'result', resultId],
        queryFn: () => quizApi.getQuizResults(resultId!),
        enabled: !!resultId,
    })
}

export const useQuizHistory = (query?: QuizHistoryQuery) => {
    return useQuery<{
        quizResults: QuizResult[]
        pagination: {
            total: number
            page: number
            limit: number
            totalPages: number
        }
    }>({
        queryKey: ['quiz', 'history', query],
        queryFn: () => quizApi.getUserQuizHistory(query),
    })
}
