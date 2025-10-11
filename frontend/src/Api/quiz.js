import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from './request'

// Quiz API functions
export const quizApi = {
    startQuiz: async (selectedTags) => {
        const response = await request.post('/quiz/start', { selectedTags })
        return response.data
    },

    submitQuiz: async (quizData) => {
        const response = await request.post('/quiz/submit', quizData)
        return response.data
    },

    getQuizResults: async (resultId) => {
        const response = await request.get(`/quiz/results/${resultId}`)
        return response.data
    },

    getUserQuizHistory: async () => {
        const response = await request.get('/quiz/history')
        return response.data
    },
}

// React Query hooks
export const useStartQuiz = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: quizApi.startQuiz,
        onSuccess: (data) => {
            // Cache the quiz data
            queryClient.setQueryData(['quiz', data.quizId], data)
        },
    })
}

export const useSubmitQuiz = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: quizApi.submitQuiz,
        onSuccess: (data) => {
            // Invalidate and refetch quiz history
            queryClient.invalidateQueries({ queryKey: ['quiz', 'history'] })
            // Cache the result
            queryClient.setQueryData(['quiz', 'result', data.resultId], data)
        },
    })
}

export const useQuizResults = (resultId) => {
    return useQuery({
        queryKey: ['quiz', 'result', resultId],
        queryFn: () => quizApi.getQuizResults(resultId),
        enabled: !!resultId,
    })
}

export const useQuizHistory = () => {
    return useQuery({
        queryKey: ['quiz', 'history'],
        queryFn: quizApi.getUserQuizHistory,
    })
}
