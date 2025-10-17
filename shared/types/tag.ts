// Shared types for tag-related DTOs
// Extracted from backend/src/types/tag.ts

export interface TagDTO {
    tagId: string
    tagName: string
}

// Re-export types from schemas (generated from Zod schemas)
export type { CreateTagRequest, UpdateTagRequest } from '../schemas/tag'
