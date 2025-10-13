import { TagAttributes } from '../../db/models/tag.js'

export interface TagDTO {
    tagId: string
    tagName: string
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CreateTagRequest {
    tagName: string
}

export interface UpdateTagRequest {
    tagId: string
    tagName: string
}
