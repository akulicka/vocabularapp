import { z } from 'zod'

export interface TagDTO {
    tagId: string
    tagName: string
}

// Zod schemas for request validation
export const CreateTagRequestSchema = z.object({
    tagName: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
})

export const UpdateTagRequestSchema = z.object({
    tagId: z.string().uuid('Invalid tag ID'),
    tagName: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
})

// Generate types from schemas
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>
