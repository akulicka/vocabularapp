import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import { withTransaction } from '@util/transaction.js'
import { TagDTO } from '@types'

export async function getAllTags(): Promise<TagDTO[]> {
    const tags = await db.tags.findAll()
    return tags.map((tag) => tag.get())
}

export async function getTagById(tagId: string): Promise<TagDTO> {
    const tag = await db.tags.findOne({ where: { tagId } })
    if (!tag) throw new Error('tag does not exist')
    return tag.get()
}

export async function createTag(tagName: string, userId: string): Promise<TagDTO> {
    const nameExists = await db.tags.findOne({ where: { tagName } })
    if (nameExists) throw new Error('duplicate tag name')

    const tagId = uuidv4()
    const tag = db.tags.build({ tagId, tagName, createdBy: userId })
    await tag.save()
    return tag.get()
}

export async function updateTag(tagId: string, tagName: string): Promise<TagDTO> {
    const tag = await db.tags.findOne({ where: { tagId } })
    if (!tag) throw new Error('tag does not exist')

    tag.tagName = tagName
    await tag.save()
    return tag.get()
}

export async function deleteTag(tagId: string): Promise<void> {
    return withTransaction(async (transaction) => {
        const tag = await db.tags.findOne({ where: { tagId } })
        if (!tag) throw new Error('tag does not exist')

        await tag.setWords([], { transaction })
        await tag.destroy({ transaction })
    })
}
