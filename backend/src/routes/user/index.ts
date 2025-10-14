import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'

import { upload_file, download_file } from '@util/storage.js'
import { AuthenticatedRequest, FileUploadRequest, FilesUploadRequest } from '@types'
import { verifycookie } from '@util/cookie.js'
import db from '@db/models/index.js'

const upload = multer()
const user_router = Router()

user_router.get('/', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId, email, verified } = req.query.user
        const username = (req.query.user as any).username
        res.send({ user: { userId, email, username, verified } })
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

user_router.get('/img', [verifycookie], async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await db.users.findOne({ where: { userId: req.query.user.userId } })
        if (!user) throw new Error('user not found')
        if ((user as any).profile_image) {
            const img_buffer = await download_file((user as any).profile_image)
            if (!Buffer.isBuffer(img_buffer[0])) throw new Error('invalid image downloaded')
            res.send({ img_buffer: img_buffer[0] })
        } else {
            res.sendStatus(200)
        }
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

user_router.post('/img', [verifycookie, upload.single('avatar')], async (req: FileUploadRequest, res: Response) => {
    try {
        if (!req.file) throw new Error('no pic sent')
        const user = await db.users.findOne({ where: { userId: req.query.user.userId } })
        if (!user) throw new Error('user not found')
        req.file.originalname = (user as any).profile_image || uuidv4()
        const upload_result = await upload_file(req.file)
        if ((user as any).profile_image != req.file.originalname) {
            ;(user as any).profile_image = req.file.originalname
            await user.save()
        }
        res.send({ upload_result })
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

user_router.post('/files', [verifycookie, upload.array('files[]')], async (req: FilesUploadRequest, res: Response) => {
    try {
        const files = req.body
        console.log('files', files, req.files)
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const promises = req.files.map((file: Express.Multer.File) => upload_file(file))
            const results = await Promise.all(promises)
            console.log(results)
        }
        console.log('done')
        res.sendStatus(200)
    } catch (err) {
        console.log('err', err instanceof Error ? err.message : 'Unknown error')
        res.sendStatus(500)
    }
})

export default user_router
