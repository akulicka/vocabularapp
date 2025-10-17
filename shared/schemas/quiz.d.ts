import { z } from 'zod';
export declare const StartQuizRequestSchema: z.ZodObject<{
    selectedTags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const SubmitQuizRequestSchema: z.ZodObject<{
    quizId: z.ZodString;
    answers: z.ZodArray<z.ZodObject<{
        wordId: z.ZodString;
        userAnswer: z.ZodString;
        isCorrect: z.ZodBoolean;
        skipped: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    timeSpent: z.ZodNumber;
    selectedTags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const QuizHistoryQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type StartQuizRequest = z.infer<typeof StartQuizRequestSchema>;
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequestSchema>;
export type QuizHistoryQuery = z.infer<typeof QuizHistoryQuerySchema>;
//# sourceMappingURL=quiz.d.ts.map