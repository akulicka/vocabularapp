import { NounAttributes } from '../../db/models/noun.js'
import { VerbAttributes } from '../../db/models/verb.js'
import { TagAttributes } from '../../db/models/tag.js'

export interface WordDTO {
    wordId: string
    english: string
    arabic: string
    root: string | null
    partOfSpeech: string | null
    img: string | null
    noun?: NounAttributes // ✅ Reuse from model
    verb?: VerbAttributes // ✅ Reuse from model
    tags: TagAttributes[] // ✅ Reuse from model
}

export interface CreateWordRequest {
    wordEnglish: string
    wordArabic: string
    wordSpeechPart: string
    wordTags: string[]
    nounProps?: {
        nounType: string
        nounGender: string
        nounBrokenPlural: string
    }
    verbProps?: {
        verbForm: string
        verbIrregularity: string
        verbTense: string
    }
}

export interface UpdateWordRequest {
    wordId: string
    wordEnglish: string
    wordArabic: string
    wordSpeechPart: string
    wordTags: string[]
    nounProps?: {
        nounType: string
        nounGender: string
        nounBrokenPlural: string
    }
    verbProps?: {
        verbForm: string
        verbIrregularity: string
        verbTense: string
    }
}
