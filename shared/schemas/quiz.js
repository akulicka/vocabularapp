"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizHistoryQuerySchema = exports.SubmitQuizRequestSchema = exports.StartQuizRequestSchema = void 0;
// Shared Zod schemas for quiz request validation
const zod_1 = require("zod");
// Zod schemas for request validation
exports.StartQuizRequestSchema = zod_1.z.object({
    selectedTags: zod_1.z.array(zod_1.z.string().uuid('Invalid tag ID')).min(1, 'At least one tag must be selected'),
});
exports.SubmitQuizRequestSchema = zod_1.z.object({
    quizId: zod_1.z.string().uuid('Invalid quiz ID'),
    answers: zod_1.z
        .array(zod_1.z.object({
        wordId: zod_1.z.string().uuid('Invalid word ID'),
        userAnswer: zod_1.z.string(),
        isCorrect: zod_1.z.boolean(),
        skipped: zod_1.z.boolean().optional(),
    }))
        .min(1, 'At least one answer is required'),
    timeSpent: zod_1.z.number().min(0, 'Time spent cannot be negative'),
    selectedTags: zod_1.z.array(zod_1.z.string().uuid('Invalid tag ID')),
});
exports.QuizHistoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1, 'Page must be at least 1').optional(),
    limit: zod_1.z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional(),
});
