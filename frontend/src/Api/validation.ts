// Validation helper functions for client-side validation using shared Zod schemas
import { z } from 'zod'

/**
 * Validates data against a Zod schema and returns validation result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with isValid boolean and validated data or errors
 */
export function validate<T>(
    schema: z.ZodType<T>,
    data: unknown,
): {
    isValid: boolean
    data?: T
    errors?: string[]
} {
    const result = schema.safeParse(data)
    if (!result.success) {
        return {
            isValid: false,
            errors: result.error.issues.map((issue) => issue.message),
        }
    }
    return {
        isValid: true,
        data: result.data,
    }
}
