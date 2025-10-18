import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'

import { signtoken } from '@util/cookie'
import { validateBody } from '@util/validation'
import db from '@db/models/index'
import { LoginRequest, RegisterRequest, AuthResponse, LoginRequestSchema, RegisterRequestSchema } from '@types'
import { UserAttributes } from '@db/models/user'

// Helper function
const authorize_user = async (email: string, password: string): Promise<UserAttributes> => {
    const user = await db.users.findOne({ where: { email } })
    if (!user) throw new Error('mismatch password or email')

    console.log('🔍 Found user:', user, (user as any).email)

    // Check if password hash exists and is valid
    if (!(user as any).password || (user as any).password.trim() === '') {
        throw new Error('Invalid password hash')
    }

    const match = await argon2.verify((user as any).password, password)
    if (!match) throw new Error('mismatch password or email')

    return user as any
}

const auth_router = Router()

// POST /auth/verify
auth_router.post('/verify', validateBody(LoginRequestSchema), async (req: Request<{}, AuthResponse, LoginRequest>, res: Response) => {
    try {
        const user = await authorize_user(req.body.email, req.body.password)
        const { verified, userId } = user

        res.send({
            verified: verified || process.env.VERIFY_EMAIL === 'false',
            userId,
        })
    } catch (err) {
        console.log('❌ Verify error:', err)
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

// POST /auth/login
auth_router.post('/login', validateBody(LoginRequestSchema), async (req: Request<{}, void, LoginRequest>, res: Response) => {
    try {
        const user = await authorize_user(req.body.email, req.body.password)
        if (!user) throw new Error('mismatch password or email')

        const token = signtoken(user.userId)

        res.cookie('smartposting_token', token, {
            httpOnly: true,
            path: '/',
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000, // 1 hour
        })
            .cookie('smartposting_session', 'true', {
                httpOnly: false,
                path: '/',
                secure: true,
                sameSite: 'strict',
                maxAge: 3600000, // 1 hour
            })
            .sendStatus(200)
    } catch (err) {
        console.log('❌ Login error:', err)
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

// POST /auth/logout
auth_router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('smartposting_token').clearCookie('smartposting_session').sendStatus(200)
})

// POST /auth/register
auth_router.post('/register', validateBody(RegisterRequestSchema), async (req: Request<{}, AuthResponse, RegisterRequest>, res: Response) => {
    try {
        const { email, password, username } = req.body

        // Check if user already exists
        const found = await db.users.findOne({ where: { email } })
        if (found) throw new Error('user already exists')

        // Hash password
        const hash = await argon2.hash(password)

        // Create user
        const user = await db.users.build({
            userId: uuidv4(),
            username,
            password: hash,
            email,
        })

        await user.save()

        const { verified, userId } = user as any

        res.send({
            verified: verified || process.env.VERIFY_EMAIL === 'false',
            userId,
        })
    } catch (err) {
        console.log('❌ Register error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

export default auth_router
