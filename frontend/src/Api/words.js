import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from './request'

// Words API functions
export const wordsApi = {
    getWords: async () => {
        const response = await request.get('/words')
        return response.data
    },

    getTags: async () => {
        const response = await request.get('/words/tags')
        return response.data
    },

    createWord: async (wordData) => {
        const response = await request.post('/words', wordData)
        return response.data
    },

    updateWord: async (wordId, wordData) => {
        const response = await request.put(`/words/${wordId}`, wordData)
        return response.data
    },

    deleteWord: async (wordId) => {
        const response = await request.delete(`/words/${wordId}`)
        return response.data
    },

    createTag: async (tagData) => {
        const response = await request.post('/words/tag', tagData)
        return response.data
    },

    updateTag: async (tagData) => {
        const response = await request.put('/words/tag', tagData)
        return response.data
    },

    deleteTag: async (tagId) => {
        const response = await request.delete(`/words/tag?tagId=${tagId}`)
        return response.data
    },
}

// React Query hooks
export const useWords = () => {
    return useQuery({
        queryKey: ['words'],
        queryFn: wordsApi.getWords,
    })
}

export const useTags = () => {
    return useQuery({
        queryKey: ['tags'],
        queryFn: wordsApi.getTags,
    })
}

export const useCreateWord = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: wordsApi.createWord,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['words'] }),
    })
}

export const useUpdateWord = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ wordId, wordData }) => wordsApi.updateWord(wordId, wordData),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['words'] }),
    })
}

export const useDeleteWord = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: wordsApi.deleteWord,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['words'] }),
    })
}

export const useCreateTag = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: wordsApi.createTag,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
    })
}

export const useUpdateTag = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: wordsApi.updateTag,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
    })
}

export const useDeleteTag = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: wordsApi.deleteTag,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
    })
}
