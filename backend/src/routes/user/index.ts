import { Router, Request, Response } from 'express'
import multer from 'multer'

import { AuthenticatedRequest, FileUploadRequest, FilesUploadRequest } from '@types'
import { verifycookie } from '@util/cookie.js'
import { downloadProfileImage, uploadProfileImage, uploadMultipleFiles } from '@services/user.js'

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
        const imgBuffer = await downloadProfileImage(req.query.user.userId)
        if (imgBuffer) {
            res.send({ img_buffer: imgBuffer })
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
        const uploadResult = await uploadProfileImage(req.query.user.userId, req.file)
        res.send({ upload_result: uploadResult })
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
            const results = await uploadMultipleFiles(req.files)
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
