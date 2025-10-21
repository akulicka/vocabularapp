import { Router, Request, Response } from 'express'
import { validateBody } from '@util/validation'
import { LoginRequest, RegisterRequest, LoginRequestSchema, RegisterRequestSchema } from '@shared/schemas'
import { AuthResponse } from '@shared/types'
import { verifyCredentials, authenticateUser, generateToken, registerUser } from '@services/auth.js'

const auth_router = Router()

// POST /auth/verify
auth_router.post('/verify', validateBody(LoginRequestSchema), async (req: Request<{}, AuthResponse, LoginRequest>, res: Response) => {
    try {
        const result = await verifyCredentials(req.body.email, req.body.password)
        res.send(result)
    } catch (err) {
        console.log('❌ Verify error:', err)
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

// POST /auth/login
auth_router.post('/login', validateBody(LoginRequestSchema), async (req: Request<{}, void, LoginRequest>, res: Response) => {
    try {
        const user = await authenticateUser(req.body.email, req.body.password)
        const token = await generateToken(user.userId)

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
        const result = await registerUser(req.body)
        res.send(result)
    } catch (err) {
        console.log('❌ Register error:', err instanceof Error ? err.message : 'Unknown error')
        res.status(500).send(err instanceof Error ? err.message : 'Unknown error')
    }
})

export default auth_router
