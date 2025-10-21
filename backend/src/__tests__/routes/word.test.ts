import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import wordRouter from '@routes/word/index.js'
import * as wordService from '@services/word.js'
import * as tagService from '@services/tag.js'
import { verifycookie } from '@util/cookie.js'
import { validateBody } from '@util/validation.js'
import { CreateWordRequest, UpdateWordRequest, PARTS_OF_SPEECH } from '@types'

// Mock dependencies
vi.mock('@services/word.js')
vi.mock('@services/tag.js')
vi.mock('@util/cookie.js')
vi.mock('@util/validation.js')

// Mock validation middleware
vi.mocked(validateBody).mockImplementation(() => (req: any, res: any, next: any) => next())

// Mock cookie verification middleware
vi.mocked(verifycookie).mockImplementation(async (req: any, res: any, next: any) => {
    req.query = {
        ...req.query,
        user: {
            userId: 'test-user-id',
            email: 'test@example.com',
            verified: true,
        },
    }
    next()
})

describe('Word Routes', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/words', wordRouter)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('GET /api/words', () => {
        it('should return all words', async () => {
            const mockWords = [
                {
                    wordId: 'word-1',
                    english: 'book',
                    arabic: 'كتاب',
                    root: null,
                    partOfSpeech: PARTS_OF_SPEECH.NOUN,
                    img: null,
                    tags: [],
                },
            ]

            vi.mocked(wordService.getAllWords).mockResolvedValue(mockWords)

            const response = await request(app).get('/api/words').expect(200)

            expect(response.body).toEqual(mockWords)
            expect(wordService.getAllWords).toHaveBeenCalled()
        })

        it('should handle service errors', async () => {
            vi.mocked(wordService.getAllWords).mockRejectedValue(new Error('Database error'))

            const response = await request(app).get('/api/words').expect(500)

            expect(response.text).toBe('Database error')
        })
    })

    describe('POST /api/words', () => {
        it('should create a new word', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'book',
                wordArabic: 'كتاب',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: ['tag-1'],
                nounProps: {
                    nounType: 'INDEFINITE_NOUN',
                    nounGender: 'MALE',
                    nounBrokenPlural: 'كتب',
                },
            }

            const mockCreatedWord = {
                wordId: 'word-1',
                english: 'book',
                arabic: 'كتاب',
                root: null,
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
                img: null,
                tags: [],
            }

            vi.mocked(wordService.createWord).mockResolvedValue(mockCreatedWord)

            const response = await request(app).post('/api/words').send(createRequest).expect(200)

            expect(response.body).toEqual(mockCreatedWord)
            expect(wordService.createWord).toHaveBeenCalledWith(createRequest, 'test-user-id')
        })

        it('should handle creation errors', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'book',
                wordArabic: 'كتاب',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [],
                nounProps: {
                    nounType: 'INDEFINITE_NOUN',
                    nounGender: 'MALE',
                    nounBrokenPlural: 'كتب',
                },
            }

            vi.mocked(wordService.createWord).mockRejectedValue(new Error('Validation error'))

            const response = await request(app).post('/api/words').send(createRequest).expect(500)

            expect(response.text).toBe('Validation error')
        })
    })

    describe('PUT /api/words', () => {
        it('should update an existing word', async () => {
            const updateRequest: UpdateWordRequest = {
                wordId: 'word-1',
                wordEnglish: 'updated book',
                wordArabic: 'كتاب محدث',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: ['tag-1'],
                nounProps: {
                    nounType: 'DEFINITE_NOUN',
                    nounGender: 'FEMALE',
                    nounBrokenPlural: 'كتب محدثة',
                },
            }

            const mockUpdatedWord = {
                wordId: 'word-1',
                english: 'updated book',
                arabic: 'كتاب محدث',
                root: null,
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
                img: null,
                tags: [],
            }

            vi.mocked(wordService.updateWord).mockResolvedValue(mockUpdatedWord)

            const response = await request(app).put('/api/words').send(updateRequest).expect(200)

            expect(response.body).toEqual(mockUpdatedWord)
            expect(wordService.updateWord).toHaveBeenCalledWith('word-1', updateRequest)
        })

        it('should handle update errors', async () => {
            const updateRequest: UpdateWordRequest = {
                wordId: 'word-1',
                wordEnglish: 'updated book',
                wordArabic: 'كتاب محدث',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [],
                nounProps: {
                    nounType: 'DEFINITE_NOUN',
                    nounGender: 'FEMALE',
                    nounBrokenPlural: 'كتب محدثة',
                },
            }

            vi.mocked(wordService.updateWord).mockRejectedValue(new Error('Word not found'))

            const response = await request(app).put('/api/words').send(updateRequest).expect(500)

            expect(response.text).toBe('Word not found')
        })
    })

    describe('DELETE /api/words', () => {
        it('should delete a word', async () => {
            vi.mocked(wordService.deleteWord).mockResolvedValue()

            const response = await request(app).delete('/api/words').query({ wordId: 'word-1' }).expect(200)

            expect(response.status).toBe(200)
            expect(wordService.deleteWord).toHaveBeenCalledWith('word-1')
        })

        it('should handle missing wordId', async () => {
            const response = await request(app).delete('/api/words').expect(500)

            expect(response.text).toBe('wordId is required')
        })

        it('should handle deletion errors', async () => {
            vi.mocked(wordService.deleteWord).mockRejectedValue(new Error('Word not found'))

            const response = await request(app).delete('/api/words').query({ wordId: 'word-1' }).expect(500)

            expect(response.text).toBe('Word not found')
        })
    })

    describe('POST /api/words/tag', () => {
        it('should create a new tag', async () => {
            const createTagRequest = {
                tagName: 'new-tag',
            }

            const mockCreatedTag = {
                tagId: 'tag-1',
                tagName: 'new-tag',
            }

            vi.mocked(tagService.createTag).mockResolvedValue(mockCreatedTag)

            const response = await request(app).post('/api/words/tag').send(createTagRequest).expect(200)

            expect(response.body).toEqual(mockCreatedTag)
            expect(tagService.createTag).toHaveBeenCalledWith('new-tag', 'test-user-id')
        })

        it('should handle tag creation errors', async () => {
            const createTagRequest = {
                tagName: 'new-tag',
            }

            vi.mocked(tagService.createTag).mockRejectedValue(new Error('Tag already exists'))

            const response = await request(app).post('/api/words/tag').send(createTagRequest).expect(500)

            expect(response.text).toBe('Tag already exists')
        })
    })

    describe('DELETE /api/words/tag', () => {
        it('should delete a tag', async () => {
            vi.mocked(tagService.deleteTag).mockResolvedValue()

            const response = await request(app).delete('/api/words/tag').query({ tagId: 'tag-1' }).expect(200)

            expect(response.status).toBe(200)
            expect(tagService.deleteTag).toHaveBeenCalledWith('tag-1')
        })

        it('should handle missing tagId', async () => {
            const response = await request(app).delete('/api/words/tag').expect(500)

            expect(response.text).toBe('tagId is required')
        })

        it('should handle tag deletion errors', async () => {
            vi.mocked(tagService.deleteTag).mockRejectedValue(new Error('Tag not found'))

            const response = await request(app).delete('/api/words/tag').query({ tagId: 'tag-1' }).expect(500)

            expect(response.text).toBe('Tag not found')
        })
    })

    describe('PUT /api/words/tag', () => {
        it('should update a tag', async () => {
            const updateTagRequest = {
                tagId: 'tag-1',
                tagName: 'updated-tag',
            }

            const mockUpdatedTag = {
                tagId: 'tag-1',
                tagName: 'updated-tag',
            }

            vi.mocked(tagService.updateTag).mockResolvedValue(mockUpdatedTag)

            const response = await request(app).put('/api/words/tag').send(updateTagRequest).expect(200)

            expect(response.body).toEqual(mockUpdatedTag)
            expect(tagService.updateTag).toHaveBeenCalledWith('tag-1', 'updated-tag')
        })

        it('should handle tag update errors', async () => {
            const updateTagRequest = {
                tagId: 'tag-1',
                tagName: 'updated-tag',
            }

            vi.mocked(tagService.updateTag).mockRejectedValue(new Error('Tag not found'))

            const response = await request(app).put('/api/words/tag').send(updateTagRequest).expect(500)

            expect(response.text).toBe('Tag not found')
        })
    })

    describe('GET /api/words/tag', () => {
        it('should get a tag by id', async () => {
            const mockTag = {
                tagId: 'tag-1',
                tagName: 'test-tag',
            }

            vi.mocked(tagService.getTagById).mockResolvedValue(mockTag)

            const response = await request(app).get('/api/words/tag').query({ tagId: 'tag-1' }).expect(200)

            expect(response.body).toEqual(mockTag)
            expect(tagService.getTagById).toHaveBeenCalledWith('tag-1')
        })

        it('should handle missing tagId', async () => {
            const response = await request(app).get('/api/words/tag').expect(500)

            expect(response.text).toBe('tagId is required')
        })

        it('should handle tag retrieval errors', async () => {
            vi.mocked(tagService.getTagById).mockRejectedValue(new Error('Tag not found'))

            const response = await request(app).get('/api/words/tag').query({ tagId: 'tag-1' }).expect(500)

            expect(response.text).toBe('Tag not found')
        })
    })

    describe('GET /api/words/tags', () => {
        it('should get all tags', async () => {
            const mockTags = [
                { tagId: 'tag-1', tagName: 'tag1' },
                { tagId: 'tag-2', tagName: 'tag2' },
            ]

            vi.mocked(tagService.getAllTags).mockResolvedValue(mockTags)

            const response = await request(app).get('/api/words/tags').expect(200)

            expect(response.body).toEqual(mockTags)
            expect(tagService.getAllTags).toHaveBeenCalled()
        })

        it('should handle tag retrieval errors', async () => {
            vi.mocked(tagService.getAllTags).mockRejectedValue(new Error('Database error'))

            const response = await request(app).get('/api/words/tags').expect(500)

            expect(response.text).toBe('Database error')
        })
    })
})
