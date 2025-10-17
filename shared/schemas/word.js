"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWordRequestSchema = exports.CreateWordRequestSchema = void 0;
// Shared Zod schemas for word-related request validation
const zod_1 = require("zod");
// Zod schemas for request validation
exports.CreateWordRequestSchema = zod_1.z
    .object({
    wordEnglish: zod_1.z.string().min(1, 'English word is required'),
    wordArabic: zod_1.z.string().min(1, 'Arabic word is required'),
    wordSpeechPart: zod_1.z.enum(['NOUN', 'VERB', 'PARTICLE'], {
        message: 'Part of speech must be NOUN, VERB, or PARTICLE',
    }),
    wordTags: zod_1.z.array(zod_1.z.string().uuid('Invalid tag ID')),
    nounProps: zod_1.z
        .object({
        nounType: zod_1.z.enum(['DEFINITE_NOUN', 'INDEFINITE_NOUN', 'ADJECTIVE', 'VERBAL_NOUN'], {
            message: 'Invalid noun type',
        }),
        nounGender: zod_1.z.enum(['MALE', 'FEMALE'], {
            message: 'Gender must be MALE or FEMALE',
        }),
        nounBrokenPlural: zod_1.z.string().min(1, 'Broken plural is required'),
    })
        .optional(),
    verbProps: zod_1.z
        .object({
        verbForm: zod_1.z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], {
            message: 'Invalid verb form',
        }),
        verbIrregularity: zod_1.z.enum(['REGULAR', 'DOUBLED', 'HAMZATED_1', 'HAMZATED_2', 'HAMZATED_3', 'ASSIMILATED', 'HOLLOW', 'DEFECTIVE', 'MULTIPLE'], {
            message: 'Invalid irregularity type',
        }),
        verbTense: zod_1.z.enum(['PAST', 'PRESENT'], {
            message: 'Tense must be PAST or PRESENT',
        }),
    })
        .optional(),
})
    .refine((data) => {
    // Require nounProps if part of speech is NOUN
    if (data.wordSpeechPart === 'NOUN' && !data.nounProps) {
        return false;
    }
    return true;
}, {
    message: 'Noun properties are required when part of speech is NOUN',
    path: ['nounProps'],
})
    .refine((data) => {
    // Require verbProps if part of speech is VERB
    if (data.wordSpeechPart === 'VERB' && !data.verbProps) {
        return false;
    }
    return true;
}, {
    message: 'Verb properties are required when part of speech is VERB',
    path: ['verbProps'],
});
exports.UpdateWordRequestSchema = zod_1.z
    .object({
    wordId: zod_1.z.string().uuid('Invalid word ID'),
    wordEnglish: zod_1.z.string().min(1, 'English word is required'),
    wordArabic: zod_1.z.string().min(1, 'Arabic word is required'),
    wordSpeechPart: zod_1.z.enum(['NOUN', 'VERB', 'PARTICLE'], {
        message: 'Part of speech must be NOUN, VERB, or PARTICLE',
    }),
    wordTags: zod_1.z.array(zod_1.z.string().uuid('Invalid tag ID')),
    nounProps: zod_1.z
        .object({
        nounType: zod_1.z.enum(['DEFINITE_NOUN', 'INDEFINITE_NOUN', 'ADJECTIVE', 'VERBAL_NOUN'], {
            message: 'Invalid noun type',
        }),
        nounGender: zod_1.z.enum(['MALE', 'FEMALE'], {
            message: 'Gender must be MALE or FEMALE',
        }),
        nounBrokenPlural: zod_1.z.string().min(1, 'Broken plural is required'),
    })
        .optional(),
    verbProps: zod_1.z
        .object({
        verbForm: zod_1.z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], {
            message: 'Invalid verb form',
        }),
        verbIrregularity: zod_1.z.enum(['REGULAR', 'DOUBLED', 'HAMZATED_1', 'HAMZATED_2', 'HAMZATED_3', 'ASSIMILATED', 'HOLLOW', 'DEFECTIVE', 'MULTIPLE'], {
            message: 'Invalid irregularity type',
        }),
        verbTense: zod_1.z.enum(['PAST', 'PRESENT'], {
            message: 'Tense must be PAST or PRESENT',
        }),
    })
        .optional(),
})
    .refine((data) => {
    // Require nounProps if part of speech is NOUN
    if (data.wordSpeechPart === 'NOUN' && !data.nounProps) {
        return false;
    }
    return true;
}, {
    message: 'Noun properties are required when part of speech is NOUN',
    path: ['nounProps'],
})
    .refine((data) => {
    // Require verbProps if part of speech is VERB
    if (data.wordSpeechPart === 'VERB' && !data.verbProps) {
        return false;
    }
    return true;
}, {
    message: 'Verb properties are required when part of speech is VERB',
    path: ['verbProps'],
});
