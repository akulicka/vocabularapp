"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRequestSchema = exports.LoginRequestSchema = void 0;
// Shared Zod schemas for authentication request validation
const zod_1 = require("zod");
// Zod schemas for request validation
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.RegisterRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    username: zod_1.z.string().min(1, 'Username is required').max(50, 'Username too long'),
});
