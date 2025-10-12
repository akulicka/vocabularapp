import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'

import { signtoken } from '../../util/cookie.js'
import db from '../../../db/models/index.js'

// Types
interface LoginRequest {
    email: string
    password: string
}

interface RegisterRequest {
    email: string
    password: string
    username: string
}

interface AuthResponse {
    verified: boolean
    userId: string
}

interface User {
    userId: string
    email: string
    password: string
    username?: string
    verified?: boolean
}

// Helper function
const authorize_user = async (email: string, password: string): Promise<User> => {
    const user = await db.users.findOne({ where: { email } })
    if (!user) throw new Error('mismatch password or email')

    console.log('🔍 Found user:', user, user.email)

    // Check if password hash exists and is valid
    if (!user.password || user.password.trim() === '') {
        throw new Error('Invalid password hash')
    }

    const match = await argon2.verify(user.password, password)
    if (!match) throw new Error('mismatch password or email')

    return user
}

const auth_router = Router()

// POST /auth/verify
auth_router.post('/verify', async (req: Request<{}, AuthResponse, LoginRequest>, res: Response) => {
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
auth_router.post('/login', async (req: Request<{}, void, LoginRequest>, res: Response) => {
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
auth_router.post('/register', async (req: Request<{}, AuthResponse, RegisterRequest>, res: Response) => {
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

        const { verified, userId } = user

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
