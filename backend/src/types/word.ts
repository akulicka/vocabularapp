import { NounAttributes } from '@db/models/noun.js'
import { VerbAttributes } from '@db/models/verb.js'
import { TagDTO } from './tag.js'

export interface WordDTO {
    wordId: string
    english: string
    arabic: string
    root: string | null
    partOfSpeech: string | null
    img: string | null
    noun?: NounAttributes // ✅ Reuse from model
    verb?: VerbAttributes // ✅ Reuse from model
    tags: TagDTO[] // ✅ Reuse from model
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

export const PARTS_OF_SPEECH = {
    NOUN: 'NOUN',
    VERB: 'VERB',
    PARTICLE: 'PARTICLE',
} as const

export const GENDERS = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
} as const

export const TYPES_OF_NOUN = {
    DEFINITE_NOUN: 'DEFINITE_NOUN',
    INDEFINITE_NOUN: 'INDEFINITE_NOUN',
    ADJECTIVE: 'ADJECTIVE',
    VERBAL_NOUN: 'VERBAL_NOUN',
} as const

export const TENSES_OF_VERB = {
    PAST: 'PAST',
    PRESENT: 'PRESENT',
} as const

export const FORMS_OF_VERB = {
    I: 'I',
    II: 'II',
    III: 'III',
    IV: 'IV',
    V: 'V',
    VI: 'VI',
    VII: 'VII',
    VIII: 'VIII',
    IX: 'IX',
    X: 'X',
} as const

export const IRREGULARITIES_OF_VERB = {
    REGULAR: 'REGULAR',
    DOUBLED: 'DOUBLED',
    HAMZATED_1: 'HAMZATED_1',
    HAMZATED_2: 'HAMZATED_2',
    HAMZATED_3: 'HAMZATED_3',
    ASSIMILATED: 'ASSIMILATED',
    HOLLOW: 'HOLLOW',
    DEFECTIVE: 'DEFECTIVE',
    MULTIPLE: 'MULTIPLE',
} as const
