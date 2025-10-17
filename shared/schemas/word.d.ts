import { z } from 'zod';
export declare const CreateWordRequestSchema: z.ZodObject<{
    wordEnglish: z.ZodString;
    wordArabic: z.ZodString;
    wordSpeechPart: z.ZodEnum<{
        NOUN: "NOUN";
        VERB: "VERB";
        PARTICLE: "PARTICLE";
    }>;
    wordTags: z.ZodArray<z.ZodString>;
    nounProps: z.ZodOptional<z.ZodObject<{
        nounType: z.ZodEnum<{
            DEFINITE_NOUN: "DEFINITE_NOUN";
            INDEFINITE_NOUN: "INDEFINITE_NOUN";
            ADJECTIVE: "ADJECTIVE";
            VERBAL_NOUN: "VERBAL_NOUN";
        }>;
        nounGender: z.ZodEnum<{
            MALE: "MALE";
            FEMALE: "FEMALE";
        }>;
        nounBrokenPlural: z.ZodString;
    }, z.core.$strip>>;
    verbProps: z.ZodOptional<z.ZodObject<{
        verbForm: z.ZodEnum<{
            I: "I";
            II: "II";
            III: "III";
            IV: "IV";
            V: "V";
            VI: "VI";
            VII: "VII";
            VIII: "VIII";
            IX: "IX";
            X: "X";
        }>;
        verbIrregularity: z.ZodEnum<{
            REGULAR: "REGULAR";
            DOUBLED: "DOUBLED";
            HAMZATED_1: "HAMZATED_1";
            HAMZATED_2: "HAMZATED_2";
            HAMZATED_3: "HAMZATED_3";
            ASSIMILATED: "ASSIMILATED";
            HOLLOW: "HOLLOW";
            DEFECTIVE: "DEFECTIVE";
            MULTIPLE: "MULTIPLE";
        }>;
        verbTense: z.ZodEnum<{
            PAST: "PAST";
            PRESENT: "PRESENT";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const UpdateWordRequestSchema: z.ZodObject<{
    wordId: z.ZodString;
    wordEnglish: z.ZodString;
    wordArabic: z.ZodString;
    wordSpeechPart: z.ZodEnum<{
        NOUN: "NOUN";
        VERB: "VERB";
        PARTICLE: "PARTICLE";
    }>;
    wordTags: z.ZodArray<z.ZodString>;
    nounProps: z.ZodOptional<z.ZodObject<{
        nounType: z.ZodEnum<{
            DEFINITE_NOUN: "DEFINITE_NOUN";
            INDEFINITE_NOUN: "INDEFINITE_NOUN";
            ADJECTIVE: "ADJECTIVE";
            VERBAL_NOUN: "VERBAL_NOUN";
        }>;
        nounGender: z.ZodEnum<{
            MALE: "MALE";
            FEMALE: "FEMALE";
        }>;
        nounBrokenPlural: z.ZodString;
    }, z.core.$strip>>;
    verbProps: z.ZodOptional<z.ZodObject<{
        verbForm: z.ZodEnum<{
            I: "I";
            II: "II";
            III: "III";
            IV: "IV";
            V: "V";
            VI: "VI";
            VII: "VII";
            VIII: "VIII";
            IX: "IX";
            X: "X";
        }>;
        verbIrregularity: z.ZodEnum<{
            REGULAR: "REGULAR";
            DOUBLED: "DOUBLED";
            HAMZATED_1: "HAMZATED_1";
            HAMZATED_2: "HAMZATED_2";
            HAMZATED_3: "HAMZATED_3";
            ASSIMILATED: "ASSIMILATED";
            HOLLOW: "HOLLOW";
            DEFECTIVE: "DEFECTIVE";
            MULTIPLE: "MULTIPLE";
        }>;
        verbTense: z.ZodEnum<{
            PAST: "PAST";
            PRESENT: "PRESENT";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateWordRequest = z.infer<typeof CreateWordRequestSchema>;
export type UpdateWordRequest = z.infer<typeof UpdateWordRequestSchema>;
//# sourceMappingURL=word.d.ts.map