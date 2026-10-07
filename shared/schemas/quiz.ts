// Shared Zod schemas for quiz request validation
import { z } from "zod";

export const StartQuizRequestSchema = z.object({
  selectedTags: z
    .array(z.string().uuid("Invalid tag ID"))
    .min(1, "At least one tag must be selected"),
});

export const SubmitAnswerRequestSchema = z.object({
  wordId: z.string().uuid("Invalid word ID"),
  userAnswer: z.string().max(255, "Answer is too long"),
});

export const QuizIdParamsSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID"),
});

export const QuizHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional(),
});

export type StartQuizRequest = z.infer<typeof StartQuizRequestSchema>;
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>;
export type QuizIdParams = z.infer<typeof QuizIdParamsSchema>;
export type QuizHistoryQuery = z.infer<typeof QuizHistoryQuerySchema>;
