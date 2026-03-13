import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import * as wordService from '@services/word.js'
import db from '@db/models/index.js'
import { CreateWordRequest, UpdateWordRequest, PARTS_OF_SPEECH } from '@types'
import { createMockInstance } from '../mocks/database.js'

// Mock the database
vi.mock('@db/models/index.js', () => ({
    default: {
        words: { findAll: vi.fn(), findOne: vi.fn(), build: vi.fn() },
        nouns: {},
        verbs: {},
        tags: {},
    },
}))

// Mock transaction utility
vi.mock('@util/transaction.js', () => ({
    withTransaction: vi.fn((fn) => fn({})),
}))

describe('Word Service', () => {
    const mockUserId = uuidv4()
    const mockWordId = uuidv4()
    const mockTagId = uuidv4()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getAllWords', () => {
        it('should return all words with tags', async () => {
            const mockWords = [
                {
                    get: vi.fn().mockReturnValue({ wordId: mockWordId, english: 'test', arabic: 'اختبار', partOfSpeech: PARTS_OF_SPEECH.NOUN }),
                    getTags: vi.fn().mockResolvedValue([{ get: vi.fn().mockReturnValue({ tagId: mockTagId, tagName: 'test-tag' }) }]),
                },
            ]
            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)

            const result = await wordService.getAllWords()

            expect(result).toHaveLength(1)
            expect(result[0]).toHaveProperty('wordId')
            expect(result[0]).toHaveProperty('tags')
            expect(db.words.findAll).toHaveBeenCalled()
        })

        it('should handle database errors', async () => {
            vi.mocked(db.words.findAll).mockRejectedValue(new Error('Database error'))
            await expect(wordService.getAllWords()).rejects.toThrow('Database error')
        })
    })

    describe('fetchCompleteWord', () => {
        it('should return word by ID', async () => {
            const mockWord = createMockInstance({
                wordId: mockWordId,
                english: 'test',
                arabic: 'اختبار',
            })
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.fetchCompleteWord(mockWordId)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('wordId')
            expect(db.words.findOne).toHaveBeenCalledWith({ where: { wordId: mockWordId } })
        })

        it('should handle word not found', async () => {
            vi.mocked(db.words.findOne).mockResolvedValue(null)
            await expect(wordService.fetchCompleteWord(mockWordId)).rejects.toThrow('word not found')
        })
    })

    describe('createWord', () => {
        it('should create word successfully', async () => {
            const mockWordData = {
                wordEnglish: 'test',
                wordArabic: 'اختبار',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [mockTagId],
                nounProps: {
                    nounType: 'DEFINITE_NOUN',
                    nounGender: 'MALE',
                    nounBrokenPlural: 'test-plural',
                },
            }
            const mockWord = createMockInstance({ wordId: mockWordId, ...mockWordData })
            vi.mocked(db.words.build).mockReturnValue(mockWord as any)

            // Mock the fetchCompleteWord call
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.createWord(mockWordData as CreateWordRequest, mockUserId)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('wordId')
            expect(db.words.build).toHaveBeenCalledWith(expect.objectContaining({ english: 'test', arabic: 'اختبار' }))
        })

        it('should handle creation errors', async () => {
            vi.mocked(db.words.build).mockImplementation(() => {
                throw new Error('Creation failed')
            })
            const mockWordData = { wordEnglish: 'test', wordArabic: 'اختبار', wordSpeechPart: PARTS_OF_SPEECH.NOUN, wordTags: [mockTagId] }
            await expect(wordService.createWord(mockWordData as CreateWordRequest, mockUserId)).rejects.toThrow('Creation failed')
        })
    })

    describe('updateWord', () => {
        it('should update word successfully', async () => {
            const mockWord = createMockInstance({ wordId: mockWordId, wordEnglish: 'updated', arabic: 'محدث' })
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const updateData = { wordEnglish: 'updated', wordArabic: 'محدث' }
            const result = await wordService.updateWord(mockWordId, updateData as UpdateWordRequest)

            expect(result).toBeDefined()
            expect(result).toHaveProperty('wordId')
            expect(db.words.findOne).toHaveBeenCalledWith({ where: { wordId: mockWordId } })
        })

        it('should handle word not found during update', async () => {
            vi.mocked(db.words.findOne).mockResolvedValue(null)
            const updateData = { wordEnglish: 'updated' }
            await expect(wordService.updateWord(mockWordId, updateData as UpdateWordRequest)).rejects.toThrow('word not found')
        })
    })

    describe('deleteWord', () => {
        it('should delete word successfully', async () => {
            const mockWord = createMockInstance({ wordId: mockWordId })
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            await wordService.deleteWord(mockWordId)

            expect(db.words.findOne).toHaveBeenCalledWith({ where: { wordId: mockWordId } })
            expect(mockWord.destroy).toHaveBeenCalled()
        })

        it('should handle word not found during deletion', async () => {
            vi.mocked(db.words.findOne).mockResolvedValue(null)
            await expect(wordService.deleteWord(mockWordId)).rejects.toThrow('word does not exist')
        })
    })
})
