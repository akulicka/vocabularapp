import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery, validateParams, validateData } from '@util/validation.js'

describe('Validation Utility', () => {
    let mockReq: Partial<Request>
    let mockRes: Partial<Response>
    let mockNext: NextFunction

    beforeEach(() => {
        vi.clearAllMocks()
        mockReq = { body: {}, query: {}, params: {} }
        mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
        mockNext = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('validateBody', () => {
        it('should validate body successfully', () => {
            const schema = z.object({ name: z.string(), age: z.number() })
            mockReq.body = { name: 'John', age: 25 }
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
            expect(mockReq.body).toEqual({ name: 'John', age: 25 })
        })

        it('should return validation error for invalid body', () => {
            const schema = z.object({ name: z.string(), age: z.number() })
            mockReq.body = { name: 'John', age: 'invalid' }
            const middleware = validateBody(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation failed',
                details: expect.arrayContaining([expect.objectContaining({ field: 'age', message: expect.any(String), code: 'invalid_type' })]),
            })
        })

        it('should handle missing/empty/null body', () => {
            const schema = z.object({ name: z.string() })
            const middleware = validateBody(schema)

            // Test missing field
            mockReq.body = {}
            middleware(mockReq as Request, mockRes as Response, mockNext)
            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)

            // Test null body
            mockReq.body = null
            middleware(mockReq as Request, mockRes as Response, mockNext)
            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
        })
    })

    describe('validateQuery', () => {
        it('should validate query successfully', () => {
            const schema = z.object({ page: z.string().transform(Number), limit: z.string().transform(Number) })
            mockReq.query = { page: '1', limit: '10' }
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockReq.query).toEqual({ page: 1, limit: 10 })
        })

        it('should return validation error for invalid query', () => {
            const schema = z.object({ page: z.number() })
            mockReq.query = { page: 'invalid' }
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Query validation failed',
                details: expect.arrayContaining([expect.objectContaining({ field: 'page' })]),
            })
        })

        it('should handle optional parameters', () => {
            const schema = z.object({ page: z.string().transform(Number).optional() })
            mockReq.query = {}
            const middleware = validateQuery(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockReq.query).toEqual({})
        })
    })

    describe('validateParams', () => {
        it('should validate params successfully', () => {
            const schema = z.object({ id: z.string().uuid(), type: z.enum(['user', 'admin']) })
            mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000', type: 'user' }
            const middleware = validateParams(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect(mockReq.params).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000', type: 'user' })
        })

        it('should return validation error for invalid params', () => {
            const schema = z.object({ id: z.string().uuid() })
            mockReq.params = { id: 'invalid-uuid' }
            const middleware = validateParams(schema)

            middleware(mockReq as Request, mockRes as Response, mockNext)

            expect(mockNext).not.toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(400)
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Parameter validation failed',
                details: expect.arrayContaining([expect.objectContaining({ field: 'id' })]),
            })
        })
    })

    describe('validateData', () => {
        it('should validate data successfully', () => {
            const schema = z.object({ name: z.string(), age: z.number() })
            const data = { name: 'John', age: 25 }
            const result = validateData(schema, data)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ name: 'John', age: 25 })
            expect(result.errors).toBeUndefined()
        })

        it('should return validation errors for invalid data', () => {
            const schema = z.object({ name: z.string(), age: z.number() })
            const data = { name: 'John', age: 'invalid' }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.data).toBeUndefined()
            expect(result.errors).toEqual([{ field: 'age', message: expect.any(String), code: 'invalid_type' }])
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
        })

        it('should handle nested objects and arrays', () => {
            const schema = z.object({
                user: z.object({ name: z.string(), profile: z.object({ age: z.number() }) }),
                items: z.array(z.string()),
            })
            const data = { user: { name: 'John', profile: { age: 'invalid' } }, items: ['item1', 123] }
            const result = validateData(schema, data)

            expect(result.success).toBe(false)
            expect(result.errors).toHaveLength(2)
        })

        it('should handle null/undefined/empty data', () => {
            const schema = z.object({ name: z.string() })

            expect(validateData(schema, null).success).toBe(false)
            expect(validateData(schema, undefined).success).toBe(false)
            expect(validateData(schema, {}).success).toBe(false)
        })
    })

    describe('Complex Validation Scenarios', () => {
        it('should handle union types and custom validation', () => {
            const schema = z.object({
                status: z.union([z.literal('active'), z.literal('inactive')]),
                password: z.string().refine((val) => val.length >= 8, { message: 'Password too short' }),
            })

            const validData = { status: 'active', password: 'longpassword' }
            const result = validateData(schema, validData)

            expect(result.success).toBe(true)
            expect(result.data).toEqual(validData)
        })

        it('should handle transforms', () => {
            const schema = z.object({
                id: z.string().transform((val) => parseInt(val, 10)),
                tags: z.string().transform((val) => val.split(',')),
            })
            const data = { id: '123', tags: 'tag1,tag2,tag3' }
            const result = validateData(schema, data)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ id: 123, tags: ['tag1', 'tag2', 'tag3'] })
        })
    })

    describe('Error Handling', () => {
        it('should handle middleware errors gracefully', () => {
            const schema = z.object({ name: z.string() })
            const middleware = validateBody(schema)

            expect(() => {
                middleware(null as any, mockRes as Response, mockNext)
            }).toThrow()
        })
    })
})
