// Shared types for word-related DTOs and enums
// Extracted from backend/src/types/word.ts

// Import TagDTO for circular reference
import { TagDTO } from './tag'

export interface NounAttributes {
    wordId: string
    nounType: string | null
    gender: string | null
    brokenPlural: string | null
}

export interface VerbAttributes {
    wordId: string
    verbForm: string | null
    irregularityClass: string | null
    tense: string | null
}

export interface WordDTO {
    wordId: string
    english: string
    arabic: string
    root: string | null
    partOfSpeech: string | null
    img: string | null
    noun?: NounAttributes
    verb?: VerbAttributes
    tags: TagDTO[]
}

// Enum definitions
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

// Re-export types from schemas (generated from Zod schemas)
export type { CreateWordRequest, UpdateWordRequest } from '../schemas/word'

// Legacy type exports for backward compatibility
export type PartOfSpeech = 'NOUN' | 'VERB' | 'PARTICLE'
export type Gender = 'MALE' | 'FEMALE'
export type TypeOfNoun = 'DEFINITE_NOUN' | 'INDEFINITE_NOUN' | 'ADJECTIVE' | 'VERBAL_NOUN'
export type TenseOfVerb = 'PAST' | 'PRESENT'
export type FormOfVerb = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X'
export type IrregularityOfVerb = 'REGULAR' | 'DOUBLED' | 'HAMZATED_1' | 'HAMZATED_2' | 'HAMZATED_3' | 'ASSIMILATED' | 'HOLLOW' | 'DEFECTIVE' | 'MULTIPLE'
