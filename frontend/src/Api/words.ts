import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from './request'
import { validate } from './validation'

// Import types and schemas from shared
import {
    WordDTO,
    // CreateWordRequest,
    // UpdateWordRequest,
    TagDTO,
    // CreateTagRequest,
    // UpdateTagRequest
    // AuthenticatedRequest,
} from '@shared/types'
import { CreateWordRequestSchema, UpdateWordRequestSchema, CreateTagRequestSchema, UpdateTagRequestSchema } from '@shared/schemas'

// Words API functions with validation
export const wordsApi = {
    getWords: async (): Promise<WordDTO[]> => {
        const response = await request.get('/words')
        return response.data
    },

    getTags: async (): Promise<TagDTO[]> => {
        const response = await request.get('/words/tags')
        return response.data
    },

    createWord: async (wordData: unknown): Promise<WordDTO> => {
        // Validate input data before sending
        const validation = validate(CreateWordRequestSchema, wordData)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post('/words', validation.data)
        return response.data
    },

    updateWord: async (wordId: string, wordData: unknown): Promise<WordDTO> => {
        // Validate input data before sending
        const validation = validate(UpdateWordRequestSchema, wordData)
        console.log('validation', validation)
        console.log('wordData', wordData)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.put(`/words/${wordId}`, validation.data)
        return response.data
    },

    deleteWord: async (wordId: string): Promise<void> => {
        await request.delete(`/words/${wordId}`)
    },

    createTag: async (tagData: unknown): Promise<TagDTO> => {
        // Validate input data before sending
        const validation = validate(CreateTagRequestSchema, tagData)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.post('/words/tag', validation.data)
        return response.data
    },

    updateTag: async (tagData: unknown): Promise<TagDTO> => {
        // Validate input data before sending
        console.log('hi')
        const validation = validate(UpdateTagRequestSchema, tagData)
        if (!validation.isValid) {
            throw new Error(validation.errors?.[0] || 'Validation failed')
        }
        const response = await request.put('/words/tag', validation.data)
        return response.data
    },

    deleteTag: async (tagId: string): Promise<void> => {
        await request.delete(`/words/tag?tagId=${tagId}`)
    },
}

// React Query hooks with proper typing
export const useWords = () => {
    return useQuery<WordDTO[]>({
        queryKey: ['words'],
        queryFn: wordsApi.getWords,
    })
}

export const useTags = () => {
    return useQuery<TagDTO[]>({
        queryKey: ['tags'],
        queryFn: wordsApi.getTags,
    })
}

export const useCreateWord = () => {
    const queryClient = useQueryClient()

    return useMutation<WordDTO, Error, unknown>({
        mutationFn: wordsApi.createWord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['words'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export const useUpdateWord = () => {
    const queryClient = useQueryClient()

    return useMutation<WordDTO, Error, { wordId: string; wordData: unknown }>({
        mutationFn: ({ wordId, wordData }) => wordsApi.updateWord(wordId, wordData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['words'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export const useDeleteWord = () => {
    const queryClient = useQueryClient()

    return useMutation<void, Error, string>({
        mutationFn: wordsApi.deleteWord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['words'] })
        },
    })
}

export const useCreateTag = () => {
    const queryClient = useQueryClient()

    return useMutation<TagDTO, Error, unknown>({
        mutationFn: wordsApi.createTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export const useUpdateTag = () => {
    const queryClient = useQueryClient()

    return useMutation<TagDTO, Error, unknown>({
        mutationFn: wordsApi.updateTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export const useDeleteTag = () => {
    const queryClient = useQueryClient()

    return useMutation<void, Error, string>({
        mutationFn: wordsApi.deleteTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}
