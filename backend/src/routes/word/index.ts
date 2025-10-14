import { Router, Request, Response } from 'express'

import { verifycookie } from '@util'
import { validateBody, validateQuery } from '@/util/validation.js'
import { CreateWordRequest, UpdateWordRequest, CreateTagRequest, UpdateTagRequest, AuthenticatedRequest, CreateWordRequestSchema, UpdateWordRequestSchema, CreateTagRequestSchema, UpdateTagRequestSchema } from '@types'
import * as wordService from '@services/word.js'
import * as tagService from '@services/tag.js'

interface WordQueryRequest extends AuthenticatedRequest {
    query: AuthenticatedRequest['query'] & {
        wordId?: string
        tagId?: string
    }
}

const word_router = Router()

word_router.get('/', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const words = await wordService.getAllWords()
        res.send(words)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.post('/', [verifycookie, validateBody(CreateWordRequestSchema)], async (req: Request<{}, any, CreateWordRequest> & AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const result = await wordService.createWord(req.body, userId)
        res.send(result)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.put('/', [verifycookie, validateBody(UpdateWordRequestSchema)], async (req: Request<{}, any, UpdateWordRequest> & AuthenticatedRequest, res: Response) => {
    try {
        const { wordId } = req.body
        const result = await wordService.updateWord(wordId, req.body)
        res.send(result)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.delete('/', [verifycookie], async (req: WordQueryRequest, res: Response) => {
    try {
        const { wordId } = req.query
        if (!wordId) throw new Error('wordId is required')
        await wordService.deleteWord(wordId)
        res.sendStatus(200)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.post('/tag', [verifycookie, validateBody(CreateTagRequestSchema)], async (req: Request<{}, any, CreateTagRequest> & AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.query.user
        const { tagName } = req.body
        const tag = await tagService.createTag(tagName, userId)
        res.send(tag)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.delete('/tag', [verifycookie], async (req: WordQueryRequest, res: Response) => {
    // TODO - on frontend, need to refresh word tags - delete will not be reflected for other words in dictionary until refresh
    try {
        const { tagId } = req.query
        if (!tagId) throw new Error('tagId is required')
        await tagService.deleteTag(tagId)
        res.sendStatus(200)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.put('/tag', [verifycookie, validateBody(UpdateTagRequestSchema)], async (req: Request<{}, any, UpdateTagRequest> & AuthenticatedRequest, res: Response) => {
    try {
        const { tagId, tagName } = req.body
        const tag = await tagService.updateTag(tagId, tagName)
        res.send(tag)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.get('/tag', [verifycookie], async (req: WordQueryRequest, res: Response) => {
    try {
        const { tagId } = req.query
        if (!tagId) throw new Error('tagId is required')
        const tag = await tagService.getTagById(tagId)
        console.log(tag)
        res.send(tag)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

word_router.get('/tags', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tags = await tagService.getAllTags()
        res.send(tags)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

export default word_router
