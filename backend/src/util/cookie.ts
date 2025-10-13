import jwt from 'jsonwebtoken'
import { validate } from 'uuid'
import { Request, Response, NextFunction } from 'express'

import db from '../../db/models/index.js'
import { AuthenticatedUser } from '../types/auth.js'
import { AuthenticatedRequest } from '../types/user.js'

const secretkey = process.env.TOKEN_SECRET!

export const signtoken = (userId: string): string => jwt.sign({ userId }, secretkey, { expiresIn: '60m' })

export const verifycookie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.cookies.smartposting_token) throw new Error('no authorization')
        const token = req.cookies.smartposting_token
        const token_params = jwt.verify(token, secretkey) as jwt.JwtPayload & { userId: string }
        const { userId } = token_params
        if (!userId || !validate(userId)) throw new Error('invalid token')
        const dbUser = await db.users.findOne({ where: { userId } })
        if (!dbUser) throw new Error('invalid user')
        console.log('got user from cookie', dbUser.get('email'))
        // Cast to service type with only needed fields
        const authUser: AuthenticatedUser = {
            userId: dbUser.get('userId'),
            email: dbUser.get('email'),
            verified: dbUser.get('verified') || false,
        } as AuthenticatedUser

        ;(req as any).query = { ...req.query, user: authUser }
        next()
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.log('err', errorMessage)
        // todo - verified
        res.status(403).send({ error: errorMessage })
    }
}
