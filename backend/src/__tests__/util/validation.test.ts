import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery, validateParams, validateData, ValidationError, ValidationResult } from '@util/validation.js'

describe('Validation Utility', () => {
    let mockReq: Partial<Request>
    let mockRes: Partial<Response>
    let mockNext: NextFunction

    beforeEach(() => {
        vi.clearAllMocks()

        mockReq = {
            body: {},
            query: {},
            params: {},
        }

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        }

        mockNext = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('validateBody', () => {
        it('should validate body successfully', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            mockReq.body = { name: 'John', age: 25 }
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
            expect(mockRes.json).not.toHaveBeenCalled()
            expect(mockReq.body).toEqual({ name: 'John', age: 25 })
        })

        it('should return validation error for invalid body', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            mockReq.body = { name: 'John', age: 'invalid' }
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'age',
                        message: expect.any(String),
                        code: 'invalid_type',
                    }),
                ]),
            })
        })

        it('should handle missing required fields', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            mockReq.body = { name: 'John' }
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'age',
                        message: expect.any(String),
                        code: 'invalid_type',
                    }),
                ]),
            })
        })

        it('should handle empty body', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            mockReq.body = {}
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
        })

        it('should handle null body', () => {
            const schema = z.object({
                name: z.string(),
            })

            mockReq.body = null
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
        })

        it('should handle undefined body', () => {
            const schema = z.object({
                name: z.string(),
            })

            mockReq.body = undefined
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
        })
    })

    describe('validateQuery', () => {
        it('should validate query successfully', () => {
            const schema = z.object({
                page: z.string().transform(Number),
                limit: z.string().transform(Number),
            })

            mockReq.query = { page: '1', limit: '10' }
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
            expect(mockRes.json).not.toHaveBeenCalled()
            expect(mockReq.query).toEqual({ page: 1, limit: 10 })
        })

        it('should return validation error for invalid query', () => {
            const schema = z.object({
                page: z.string().transform(Number),
                limit: z.string().transform(Number),
            })

            mockReq.query = { page: 'invalid', limit: '10' }
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Query validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'page',
                        message: expect.any(String),
                        code: expect.any(String),
                    }),
                ]),
            })
        })

        it('should handle optional query parameters', () => {
            const schema = z.object({
                page: z.string().transform(Number).optional(),
                limit: z.string().transform(Number).optional(),
            })

            mockReq.query = { page: '1' }
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockReq.query).toEqual({ page: 1 })
        })

        it('should handle empty query', () => {
            const schema = z.object({
                page: z.string().optional(),
            })

            mockReq.query = {}
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockReq.query).toEqual({})
        })
    })

    describe('validateParams', () => {
        it('should validate params successfully', () => {
            const schema = z.object({
                id: z.string().uuid(),
                type: z.enum(['user', 'admin']),
            })

            mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000', type: 'user' }
            const middleware = validateParams(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
            expect(mockRes.json).not.toHaveBeenCalled()
            expect(mockReq.params).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000', type: 'user' })
        })

        it('should return validation error for invalid params', () => {
            const schema = z.object({
                id: z.string().uuid(),
                type: z.enum(['user', 'admin']),
            })

            mockReq.params = { id: 'invalid-uuid', type: 'user' }
            const middleware = validateParams(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Parameter validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'id',
                        message: expect.any(String),
                        code: 'invalid_string',
                    }),
                ]),
            })
        })

        it('should handle missing params', () => {
            const schema = z.object({
                id: z.string().uuid(),
            })

            mockReq.params = {}
            const middleware = validateParams(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
        })
    })

    describe('validateData', () => {
        it('should validate data successfully', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            const data = { name: 'John', age: 25 }
            const result = validateData(schema, data)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ name: 'John', age: 25 })
            expect(result.errors).toBeUndefined()
        })

        it('should return validation errors for invalid data', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            const data = { name: 'John', age: 'invalid' }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.data).toBeUndefined()
            expect(result.errors).toEqual([
                {
                    field: 'age',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })

        it('should handle multiple validation errors', () => {
            const schema = z.object({
                name: z.string().min(3),
                age: z.number().min(18),
                email: z.string().email(),
            })

            const data = { name: 'Jo', age: 15, email: 'invalid-email' }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.errors).toHaveLength(3)
            expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'name', code: 'too_small' }), expect.objectContaining({ field: 'age', code: 'too_small' }), expect.objectContaining({ field: 'email', code: 'invalid_string' })]))
        })

        it('should handle nested object validation', () => {
            const schema = z.object({
                user: z.object({
                    name: z.string(),
                    profile: z.object({
                        age: z.number(),
                    }),
                }),
            })

            const data = { user: { name: 'John', profile: { age: 'invalid' } } }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: 'user.profile.age',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })

        it('should handle array validation', () => {
            const schema = z.object({
                items: z.array(z.string()),
            })

            const data = { items: ['item1', 'item2', 123] }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: 'items.2',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })

        it('should handle null data', () => {
            const schema = z.object({
                name: z.string(),
            })

            const result = validateData(schema, null)

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: '',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })

        it('should handle undefined data', () => {
            const schema = z.object({
                name: z.string(),
            })

            const result = validateData(schema, undefined)

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: '',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })

        it('should handle empty object', () => {
            const schema = z.object({
                name: z.string(),
            })

            const result = validateData(schema, {})

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: 'name',
                    message: expect.any(String),
                    code: 'invalid_type',
                },
            ])
        })
    })

    describe('Complex Validation Scenarios', () => {
        it('should handle union types', () => {
            const schema = z.object({
                status: z.union([z.literal('active'), z.literal('inactive')]),
            })

            const validData = { status: 'active' }
            const result = validateData(schema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ status: 'active' })
        })

        it('should handle discriminated unions', () => {
            const schema = z.discriminatedUnion('type', [
                z.object({
                    type: z.literal('user'),
                    name: z.string(),
                }),
                z.object({
                    type: z.literal('admin'),
                    permissions: z.array(z.string()),
                }),
            ])

            const validData = { type: 'user', name: 'John' }
            const result = validateData(schema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ type: 'user', name: 'John' })
        })

        it('should handle optional and nullable fields', () => {
            const schema = z.object({
                name: z.string(),
                description: z.string().optional(),
                metadata: z.string().nullable(),
            })

            const data = { name: 'John', metadata: null }
            const result = validateData(schema, data)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ name: 'John', metadata: null })
        })

        it('should handle custom validation', () => {
            const schema = z.object({
                password: z.string().refine((val) => val.length >= 8, { message: 'Password must be at least 8 characters' }),
            })

            const data = { password: 'short' }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.errors).toEqual([
                {
                    field: 'password',
                    message: 'Password must be at least 8 characters',
                    code: 'custom',
                },
            ])
        })

        it('should handle transform operations', () => {
            const schema = z.object({
                id: z.string().transform((val) => parseInt(val, 10)),
                tags: z.string().transform((val) => val.split(',')),
            })

            const data = { id: '123', tags: 'tag1,tag2,tag3' }
            const result = validateData(schema, data)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({
                id: 123,
                tags: ['tag1', 'tag2', 'tag3'],
            })
        })
    })

    describe('Error Handling', () => {
        it('should handle middleware errors gracefully', () => {
            const schema = z.object({
                name: z.string(),
            })

            // Simulate a corrupted request object
            const corruptedReq = null as any
            const middleware = validateBody(schema)

            expect(() => {
                middleware(corruptedReq, mockRes as Response, mockNext)
            }).toThrow()
        })

        it('should handle response errors gracefully', () => {
            const schema = z.object({
                name: z.string(),
            })

            mockReq.body = { name: 'John' }
            const corruptedRes = {
                status: vi.fn().mockImplementation(() => {
                    throw new Error('Response error')
                }),
            } as any

            const middleware = validateBody(schema)

            expect(() => {
                middleware(mockReq as Request, corruptedRes, mockNext)
            }).toThrow('Response error')
        })

        it('should handle next function errors', () => {
            const schema = z.object({
                name: z.string(),
            })

            mockReq.body = { name: 'John' }
            const errorNext = vi.fn().mockImplementation(() => {
                throw new Error('Next error')
            })

            const middleware = validateBody(schema)

            expect(() => {
                middleware(mockReq as Request, mockRes as Response, errorNext)
            }).toThrow('Next error')
        })
    })

    describe('Type Safety', () => {
        it('should preserve TypeScript types in validateData', () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            })

            const data = { name: 'John', age: 25 }
            const result = validateData(schema, data)

            if (result.success) {
                // TypeScript should infer the correct type here
                expect(typeof result.data.name).toBe('string')
                expect(typeof result.data.age).toBe('number')
            }
        })

        it('should handle generic validation', () => {
            const stringSchema = z.string()
            const numberSchema = z.number()

            const stringResult = validateData(stringSchema, 'hello')
            const numberResult = validateData(numberSchema, 42)

            expect(stringResult.success).toBe(true)
            expect(numberResult.success).toBe(true)

            if (stringResult.success) {
                expect(typeof stringResult.data).toBe('string')
            }
            if (numberResult.success) {
                expect(typeof numberResult.data).toBe('number')
            }
        })
    })
})
