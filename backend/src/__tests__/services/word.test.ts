import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import * as wordService from '@services/word.js'
import db from '@db/models/index.js'
import { CreateWordRequest, UpdateWordRequest, PARTS_OF_SPEECH } from '@types'

// Mock the database
vi.mock('@db/models/index.js', () => ({
    default: {
        words: {
            findAll: vi.fn(),
            findOne: vi.fn(),
            build: vi.fn(),
        },
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
                    get: vi.fn().mockReturnValue({
                        wordId: mockWordId,
                        english: 'test',
                        arabic: 'اختبار',
                        partOfSpeech: PARTS_OF_SPEECH.NOUN,
                    }),
                    getTags: vi.fn().mockResolvedValue([{ get: vi.fn().mockReturnValue({ tagId: mockTagId, tagName: 'test-tag' }) }]),
                },
            ]

            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)

            const result = await wordService.getAllWords()

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                wordId: mockWordId,
                english: 'test',
                arabic: 'اختبار',
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
                tags: [{ tagId: mockTagId, tagName: 'test-tag' }],
            })
            expect(db.words.findAll).toHaveBeenCalledWith({
                include: [{ model: db.nouns }, { model: db.verbs }, { model: db.tags, through: { attributes: [] } }],
                benchmark: true,
            })
        })

        it('should handle empty word list', async () => {
            vi.mocked(db.words.findAll).mockResolvedValue([])

            const result = await wordService.getAllWords()

            expect(result).toEqual([])
        })
    })

    describe('createWord', () => {
        it('should create a noun word successfully', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'book',
                wordArabic: 'كتاب',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [mockTagId],
                nounProps: {
                    nounType: 'INDEFINITE_NOUN',
                    nounGender: 'MALE',
                    nounBrokenPlural: 'كتب',
                },
            }

            const mockWord = {
                wordId: mockWordId,
                get: vi.fn().mockReturnValue({
                    wordId: mockWordId,
                    english: 'book',
                    arabic: 'كتاب',
                    partOfSpeech: PARTS_OF_SPEECH.NOUN,
                }),
                createNoun: vi.fn().mockResolvedValue({}),
                setTags: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.words.build).mockReturnValue(mockWord as any)
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.createWord(createRequest, mockUserId)

            expect(result).toMatchObject({
                wordId: mockWordId,
                english: 'book',
                arabic: 'كتاب',
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
            })
            expect(mockWord.createNoun).toHaveBeenCalledWith(
                {
                    wordId: mockWordId,
                    nounType: 'common',
                    gender: 'masculine',
                    brokenPlural: 'كتب',
                },
                { transaction: {} },
            )
            expect(mockWord.setTags).toHaveBeenCalledWith([mockTagId], { transaction: {} })
        })

        it('should create a verb word successfully', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'read',
                wordArabic: 'قرأ',
                wordSpeechPart: PARTS_OF_SPEECH.VERB,
                wordTags: [mockTagId],
                verbProps: {
                    verbForm: 'I',
                    verbIrregularity: 'REGULAR',
                    verbTense: 'PAST',
                },
            }

            const mockWord = {
                wordId: mockWordId,
                get: vi.fn().mockReturnValue({
                    wordId: mockWordId,
                    english: 'read',
                    arabic: 'قرأ',
                    partOfSpeech: PARTS_OF_SPEECH.VERB,
                }),
                createVerb: vi.fn().mockResolvedValue({}),
                setTags: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.words.build).mockReturnValue(mockWord as any)
            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.createWord(createRequest, mockUserId)

            expect(result).toMatchObject({
                wordId: mockWordId,
                english: 'read',
                arabic: 'قرأ',
                partOfSpeech: PARTS_OF_SPEECH.VERB,
            })
            expect(mockWord.createVerb).toHaveBeenCalledWith(
                {
                    wordId: mockWordId,
                    verbForm: 'I',
                    irregularityClass: 'regular',
                    tense: 'past',
                },
                { transaction: {} },
            )
        })

        it('should throw error when nounProps not provided for noun', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'book',
                wordArabic: 'كتاب',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [],
            }

            await expect(wordService.createWord(createRequest, mockUserId)).rejects.toThrow('nounProps not provided')
        })

        it('should throw error when verbProps not provided for verb', async () => {
            const createRequest: CreateWordRequest = {
                wordEnglish: 'read',
                wordArabic: 'قرأ',
                wordSpeechPart: PARTS_OF_SPEECH.VERB,
                wordTags: [],
            }

            await expect(wordService.createWord(createRequest, mockUserId)).rejects.toThrow('verbProps not provided')
        })
    })

    describe('updateWord', () => {
        it('should update word successfully', async () => {
            const updateRequest: UpdateWordRequest = {
                wordId: mockWordId,
                wordEnglish: 'updated book',
                wordArabic: 'كتاب محدث',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [mockTagId],
                nounProps: {
                    nounType: 'DEFINITE_NOUN',
                    nounGender: 'FEMALE',
                    nounBrokenPlural: 'كتب محدثة',
                },
            }

            const mockWord = {
                getVerb: vi.fn().mockResolvedValue(null),
                getNoun: vi.fn().mockResolvedValue(null),
                createNoun: vi.fn().mockResolvedValue({}),
                setTags: vi.fn().mockResolvedValue({}),
                save: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.updateWord(mockWordId, updateRequest)

            expect(mockWord.createNoun).toHaveBeenCalledWith(
                {
                    wordId: mockWordId,
                    nounType: 'proper',
                    gender: 'feminine',
                    brokenPlural: 'كتب محدثة',
                },
                { transaction: {} },
            )
            expect(mockWord.setTags).toHaveBeenCalledWith([mockTagId], { transaction: {} })
        })

        it('should throw error when word not found', async () => {
            const updateRequest: UpdateWordRequest = {
                wordId: mockWordId,
                wordEnglish: 'updated book',
                wordArabic: 'كتاب محدث',
                wordSpeechPart: PARTS_OF_SPEECH.NOUN,
                wordTags: [],
            }

            vi.mocked(db.words.findOne).mockResolvedValue(null)

            await expect(wordService.updateWord(mockWordId, updateRequest)).rejects.toThrow('word not found')
        })
    })

    describe('deleteWord', () => {
        it('should delete word successfully', async () => {
            const mockWord = {
                getNoun: vi.fn().mockResolvedValue({ destroy: vi.fn().mockResolvedValue({}) }),
                getVerb: vi.fn().mockResolvedValue({ destroy: vi.fn().mockResolvedValue({}) }),
                setTags: vi.fn().mockResolvedValue({}),
                destroy: vi.fn().mockResolvedValue({}),
            }

            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            await wordService.deleteWord(mockWordId)

            expect(mockWord.getNoun).toHaveBeenCalled()
            expect(mockWord.getVerb).toHaveBeenCalled()
            expect(mockWord.setTags).toHaveBeenCalledWith([], { transaction: {} })
            expect(mockWord.destroy).toHaveBeenCalledWith({ transaction: {} })
        })

        it('should throw error when word does not exist', async () => {
            vi.mocked(db.words.findOne).mockResolvedValue(null)

            await expect(wordService.deleteWord(mockWordId)).rejects.toThrow('word does not exist')
        })
    })

    describe('fetchCompleteWord', () => {
        it('should fetch complete word with all relations', async () => {
            const mockWord = {
                get: vi.fn().mockReturnValue({
                    wordId: mockWordId,
                    english: 'book',
                    arabic: 'كتاب',
                    partOfSpeech: PARTS_OF_SPEECH.NOUN,
                }),
                getNoun: vi.fn().mockResolvedValue({
                    get: vi.fn().mockReturnValue({
                        nounType: 'common',
                        gender: 'masculine',
                        brokenPlural: 'كتب',
                    }),
                }),
                getVerb: vi.fn().mockResolvedValue(null),
                getTags: vi.fn().mockResolvedValue([{ get: vi.fn().mockReturnValue({ tagId: mockTagId, tagName: 'test-tag' }) }]),
            }

            vi.mocked(db.words.findOne).mockResolvedValue(mockWord as any)

            const result = await wordService.fetchCompleteWord(mockWordId)

            expect(result).toMatchObject({
                wordId: mockWordId,
                english: 'book',
                arabic: 'كتاب',
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
                noun: {
                    nounType: 'common',
                    gender: 'masculine',
                    brokenPlural: 'كتب',
                },
                tags: [{ tagId: mockTagId, tagName: 'test-tag' }],
            })
        })

        it('should throw error when word not found', async () => {
            vi.mocked(db.words.findOne).mockResolvedValue(null)

            await expect(wordService.fetchCompleteWord(mockWordId)).rejects.toThrow('word not found')
        })
    })

    describe('getWordsByTags', () => {
        it('should return words filtered by tags', async () => {
            const mockWords = [
                {
                    get: vi.fn().mockReturnValue({
                        wordId: mockWordId,
                        english: 'book',
                        arabic: 'كتاب',
                        partOfSpeech: PARTS_OF_SPEECH.NOUN,
                    }),
                    getNoun: vi.fn().mockResolvedValue(null),
                    getVerb: vi.fn().mockResolvedValue(null),
                    getTags: vi.fn().mockResolvedValue([{ get: vi.fn().mockReturnValue({ tagId: mockTagId, tagName: 'test-tag' }) }]),
                },
            ]

            vi.mocked(db.words.findAll).mockResolvedValue(mockWords as any)

            const result = await wordService.getWordsByTags([mockTagId], 10)

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                wordId: mockWordId,
                english: 'book',
                arabic: 'كتاب',
                partOfSpeech: PARTS_OF_SPEECH.NOUN,
                tags: [{ tagId: mockTagId, tagName: 'test-tag' }],
            })
            expect(db.words.findAll).toHaveBeenCalledWith({
                include: [{ model: db.tags, through: { attributes: [] }, where: { tagId: [mockTagId] } }, { model: db.nouns }, { model: db.verbs }],
                limit: 10,
            })
        })
    })
})
