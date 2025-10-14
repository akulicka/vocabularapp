import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import db from '@db/models/index.js'
import sendMessage from '@util/email.js'

const VERIFY_TOKEN_CLASS = 'VERIFY'

interface User {
    userId: string
    email: string
    username: string
}

interface Token {
    tokenId: string
    userId: string
    tokenClass: string
    createdAt: Date
    destroy(): Promise<void>
}

const create_db_token = async (user: User, token_class: string): Promise<Token> => {
    const previous_token = await db.tokens.findOne({ where: { userId: user.userId, tokenClass: token_class } })
    if (previous_token) await previous_token.destroy()
    const token = await db.tokens.build({ tokenId: uuidv4(), userId: user.userId, tokenClass: token_class })
    await token.save()
    return token as Token
}

const token_router = Router()

token_router.post('/create-verify-token', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body
        const user = await db.users.findOne({ where: { userId } })
        if (!user) throw new Error('no such user')
        // todo process env verify email
        const token = await create_db_token(user as User, VERIFY_TOKEN_CLASS)
        await sendMessage({ user: user as User, token_id: token.tokenId })
        res.sendStatus(200)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

token_router.post('/validate-verify-token', async (req: Request, res: Response) => {
    try {
        const token_lifetime_minutes = 0.5
        const { tokenId, userId } = req.body
        const user = await db.users.findOne({ where: { userId } })
        if (!user) throw new Error('no such user')
        const token = await db.tokens.findOne({ where: { userId, tokenId, tokenClass: VERIFY_TOKEN_CLASS } })
        if (!token) throw new Error('no token')
        // DEBUG console.log('date: ',new Date(token.createdAt).getTime() + (token_lifetime_minutes * 60000), ' node: ', new Date(Date()).getTime(), 'diff: ', new Date(token.createdAt).getTime() + (token_lifetime_minutes * 60000) - new Date(Date()).getTime())
        let response: string = 'error'
        if (new Date(token.createdAt).getTime() + token_lifetime_minutes * 60000 - new Date(Date()).getTime() < 0) {
            response = 'expired'
            await token.destroy()
            const new_token = await create_db_token(user as User, VERIFY_TOKEN_CLASS)
            await sendMessage({ user: user as User, token_id: new_token.tokenId })
        } else {
            await token.destroy()
            ;(user as any).verified = 1
            await user.save()
            response = 'verified'
        }
        res.send({ response })
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

export default token_router
