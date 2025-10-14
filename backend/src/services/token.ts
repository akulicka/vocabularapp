import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import sendMessage from '@util/email.js'
import { TokenUser, TokenData, CreateVerifyTokenRequest, ValidateVerifyTokenRequest, TokenValidationResponse, VERIFY_TOKEN_CLASS } from '@types'

export async function createVerifyToken(userId: string): Promise<TokenData> {
    const previous_token = await db.tokens.findOne({
        where: { userId, tokenClass: VERIFY_TOKEN_CLASS },
    })

    if (previous_token) {
        await previous_token.destroy()
    }

    const token = await db.tokens.build({
        tokenId: uuidv4(),
        userId,
        tokenClass: VERIFY_TOKEN_CLASS,
    })

    await token.save()
    return token as TokenData
}

export async function validateVerifyToken(request: ValidateVerifyTokenRequest): Promise<TokenValidationResponse> {
    const { tokenId, userId } = request
    const token_lifetime_minutes = 0.5

    const user = await db.users.findOne({ where: { userId } })
    if (!user) {
        throw new Error('no such user')
    }

    const token = await db.tokens.findOne({
        where: { userId, tokenId, tokenClass: VERIFY_TOKEN_CLASS },
    })

    if (!token) {
        throw new Error('no token')
    }

    const isExpired = new Date(token.createdAt).getTime() + token_lifetime_minutes * 60000 - new Date().getTime() < 0

    if (isExpired) {
        await token.destroy()
        const new_token = await createVerifyToken(userId)
        await sendMessage({
            user: user as TokenUser,
            token_id: new_token.tokenId,
        })
        return { response: 'expired' }
    } else {
        await token.destroy()
        ;(user as any).verified = 1
        await user.save()
        return { response: 'verified' }
    }
}

export async function sendVerificationEmail(userId: string): Promise<void> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) {
        throw new Error('no such user')
    }

    const token = await createVerifyToken(userId)
    await sendMessage({
        user: user as TokenUser,
        token_id: token.tokenId,
    })
}
