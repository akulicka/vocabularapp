// Shared Zod schemas for word-related request validation
import { z } from 'zod'

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

