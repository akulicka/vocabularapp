import { Request, Response, NextFunction } from 'express'
import { z, ZodType } from 'zod'

export interface ValidationError {
    field: string
    message: string
    code: string
}

export interface ValidationResult {
    success: boolean
    data?: any
    errors?: ValidationError[]
}

/**
 * Generic validation factory for Express middleware
 */
const createValidator = <T extends keyof Request>(property: T, errorMessage: string) => {
    return (schema: ZodType) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            const result = schema.safeParse(req[property])

            if (!result.success) {
                const errors: ValidationError[] = result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                }))

                res.status(400).json({
                    success: false,
                    error: errorMessage,
                    details: errors,
                })
                return
            }

            // Replace request property with validated data
            req[property] = result.data as any
            next()
        }
    }
}

/**
 * Validates request body against a Zod schema
 */
export const validateBody = createValidator('body', 'Validation failed')

/**
 * Validates request query parameters against a Zod schema
 */
export const validateQuery = createValidator('query', 'Query validation failed')

/**
 * Validates request params against a Zod schema
 */
export const validateParams = createValidator('params', 'Parameter validation failed')

/**
 * Helper function to validate data manually
 */
export const validateData = <T>(schema: ZodType<T>, data: unknown): ValidationResult => {
    const result = schema.safeParse(data)

    if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
        }))

        return {
            success: false,
            errors,
        }
    }

    return {
        success: true,
        data: result.data,
    }
}
