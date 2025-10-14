import { z } from 'zod'
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

// Zod schemas for request validation
export const CreateWordRequestSchema = z
    .object({
        wordEnglish: z.string().min(1, 'English word is required'),
        wordArabic: z.string().min(1, 'Arabic word is required'),
        wordSpeechPart: z.enum(['NOUN', 'VERB', 'PARTICLE'], {
            message: 'Part of speech must be NOUN, VERB, or PARTICLE',
        }),
        wordTags: z.array(z.string().uuid('Invalid tag ID')),
        nounProps: z
            .object({
                nounType: z.enum(['DEFINITE_NOUN', 'INDEFINITE_NOUN', 'ADJECTIVE', 'VERBAL_NOUN'], {
                    message: 'Invalid noun type',
                }),
                nounGender: z.enum(['MALE', 'FEMALE'], {
                    message: 'Gender must be MALE or FEMALE',
                }),
                nounBrokenPlural: z.string().min(1, 'Broken plural is required'),
            })
            .optional(),
        verbProps: z
            .object({
                verbForm: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], {
                    message: 'Invalid verb form',
                }),
                verbIrregularity: z.enum(['REGULAR', 'DOUBLED', 'HAMZATED_1', 'HAMZATED_2', 'HAMZATED_3', 'ASSIMILATED', 'HOLLOW', 'DEFECTIVE', 'MULTIPLE'], {
                    message: 'Invalid irregularity type',
                }),
                verbTense: z.enum(['PAST', 'PRESENT'], {
                    message: 'Tense must be PAST or PRESENT',
                }),
            })
            .optional(),
    })
    .refine(
        (data) => {
            // Require nounProps if part of speech is NOUN
            if (data.wordSpeechPart === 'NOUN' && !data.nounProps) {
                return false
            }
            return true
        },
        {
            message: 'Noun properties are required when part of speech is NOUN',
            path: ['nounProps'],
        },
    )
    .refine(
        (data) => {
            // Require verbProps if part of speech is VERB
            if (data.wordSpeechPart === 'VERB' && !data.verbProps) {
                return false
            }
            return true
        },
        {
            message: 'Verb properties are required when part of speech is VERB',
            path: ['verbProps'],
        },
    )

export const UpdateWordRequestSchema = z
    .object({
        wordId: z.string().uuid('Invalid word ID'),
        wordEnglish: z.string().min(1, 'English word is required'),
        wordArabic: z.string().min(1, 'Arabic word is required'),
        wordSpeechPart: z.enum(['NOUN', 'VERB', 'PARTICLE'], {
            message: 'Part of speech must be NOUN, VERB, or PARTICLE',
        }),
        wordTags: z.array(z.string().uuid('Invalid tag ID')),
        nounProps: z
            .object({
                nounType: z.enum(['DEFINITE_NOUN', 'INDEFINITE_NOUN', 'ADJECTIVE', 'VERBAL_NOUN'], {
                    message: 'Invalid noun type',
                }),
                nounGender: z.enum(['MALE', 'FEMALE'], {
                    message: 'Gender must be MALE or FEMALE',
                }),
                nounBrokenPlural: z.string().min(1, 'Broken plural is required'),
            })
            .optional(),
        verbProps: z
            .object({
                verbForm: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], {
                    message: 'Invalid verb form',
                }),
                verbIrregularity: z.enum(['REGULAR', 'DOUBLED', 'HAMZATED_1', 'HAMZATED_2', 'HAMZATED_3', 'ASSIMILATED', 'HOLLOW', 'DEFECTIVE', 'MULTIPLE'], {
                    message: 'Invalid irregularity type',
                }),
                verbTense: z.enum(['PAST', 'PRESENT'], {
                    message: 'Tense must be PAST or PRESENT',
                }),
            })
            .optional(),
    })
    .refine(
        (data) => {
            // Require nounProps if part of speech is NOUN
            if (data.wordSpeechPart === 'NOUN' && !data.nounProps) {
                return false
            }
            return true
        },
        {
            message: 'Noun properties are required when part of speech is NOUN',
            path: ['nounProps'],
        },
    )
    .refine(
        (data) => {
            // Require verbProps if part of speech is VERB
            if (data.wordSpeechPart === 'VERB' && !data.verbProps) {
                return false
            }
            return true
        },
        {
            message: 'Verb properties are required when part of speech is VERB',
            path: ['verbProps'],
        },
    )

// Generate types from schemas
export type CreateWordRequest = z.infer<typeof CreateWordRequestSchema>
export type UpdateWordRequest = z.infer<typeof UpdateWordRequestSchema>

// Legacy type exports for backward compatibility
export type PartOfSpeech = 'NOUN' | 'VERB' | 'PARTICLE'
export type Gender = 'MALE' | 'FEMALE'
export type TypeOfNoun = 'DEFINITE_NOUN' | 'INDEFINITE_NOUN' | 'ADJECTIVE' | 'VERBAL_NOUN'
export type TenseOfVerb = 'PAST' | 'PRESENT'
export type FormOfVerb = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X'
export type IrregularityOfVerb = 'REGULAR' | 'DOUBLED' | 'HAMZATED_1' | 'HAMZATED_2' | 'HAMZATED_3' | 'ASSIMILATED' | 'HOLLOW' | 'DEFECTIVE' | 'MULTIPLE'
