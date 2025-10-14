import { TagAttributes } from '@db/models/tag.js'

export interface TagDTO {
    tagId: string
    tagName: string
}

export interface CreateTagRequest {
    tagName: string
}

export interface UpdateTagRequest {
    tagId: string
    tagName: string
}
