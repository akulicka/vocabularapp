"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTagRequestSchema = exports.CreateTagRequestSchema = void 0;
// Shared Zod schemas for tag request validation
const zod_1 = require("zod");
// Zod schemas for request validation
exports.CreateTagRequestSchema = zod_1.z.object({
    tagName: zod_1.z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
});
exports.UpdateTagRequestSchema = zod_1.z.object({
    tagId: zod_1.z.string().uuid('Invalid tag ID'),
    tagName: zod_1.z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
});
