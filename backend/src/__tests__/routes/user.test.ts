import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import multer from 'multer'
import userRouter from '@routes/user/index.js'
import { downloadProfileImage, uploadProfileImage, uploadMultipleFiles } from '@services/user.js'
import { verifycookie } from '@util/cookie.js'

// Mock dependencies at module level
vi.mock('@services/user.js')
vi.mock('@util/cookie.js', () => ({
    verifycookie: vi.fn(async (req: any, res: any, next: any) => {
        req.query = {
            ...req.query,
            user: {
                userId: 'test-user-id',
                email: 'test@example.com',
                username: 'testuser',
                verified: true,
            },
        }
        next()
    }),
}))
vi.mock('multer', () => ({
    default: vi.fn(() => ({
        single: vi.fn(() => (req: any, res: any, next: any) => {
            // Mock req.file for single file upload
            req.file = {
                originalname: 'test.jpg',
                buffer: Buffer.from('fake-image-data'),
                mimetype: 'image/jpeg',
            }
            next()
        }),
        array: vi.fn(() => (req: any, res: any, next: any) => {
            // Mock req.files for multiple file upload
            req.files = [
                {
                    originalname: 'file1.jpg',
                    buffer: Buffer.from('fake-data-1'),
                    mimetype: 'image/jpeg',
                },
                {
                    originalname: 'file2.jpg',
                    buffer: Buffer.from('fake-data-2'),
                    mimetype: 'image/jpeg',
                },
            ]
            next()
        }),
    })),
}))

describe('User Routes', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/user', userRouter)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('GET /api/user', () => {
        it('should return user profile data', async () => {
            const response = await request(app).get('/api/user').expect(200)

            expect(response.body).toEqual({
                user: {
                    userId: 'test-user-id',
                    email: 'test@example.com',
                    username: 'testuser',
                    verified: true,
                },
            })
        })

        it('should handle authentication errors', async () => {
            vi.mocked(verifycookie).mockImplementationOnce(async (req: any, res: any, next: any) => {
                res.status(403).send({ error: 'Unauthorized' })
            })

            const response = await request(app).get('/api/user').expect(403)

            expect(response.body).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('GET /api/user/img', () => {
        it('should return profile image when user has one', async () => {
            const mockImageBuffer = Buffer.from('fake-image-data')

            vi.mocked(downloadProfileImage).mockResolvedValue(mockImageBuffer)

            const response = await request(app).get('/api/user/img').expect(200)

            expect(response.body.img_buffer).toBeDefined()
            // The buffer gets serialized as JSON, so we check the data property
            expect(response.body.img_buffer.data).toBeDefined()
            expect(downloadProfileImage).toHaveBeenCalledWith('test-user-id')
        })

        it('should return 200 when user has no profile image', async () => {
            vi.mocked(downloadProfileImage).mockResolvedValue(null)

            const response = await request(app).get('/api/user/img').expect(200)

            expect(response.body).toEqual({})
        })

        it('should handle user not found', async () => {
            vi.mocked(downloadProfileImage).mockRejectedValue(new Error('User not found'))

            const response = await request(app).get('/api/user/img').expect(500)

            expect(response.status).toBe(500)
        })
    })

    describe('POST /api/user/img', () => {
        it('should upload profile image successfully', async () => {
            const mockUploadResult = 'uploaded-file-path'

            vi.mocked(uploadProfileImage).mockResolvedValue(mockUploadResult)

            const response = await request(app).post('/api/user/img').expect(200)

            expect(response.body).toEqual({
                upload_result: mockUploadResult,
            })
            expect(uploadProfileImage).toHaveBeenCalledWith('test-user-id', expect.any(Object))
        })

        it('should handle user not found during upload', async () => {
            vi.mocked(uploadProfileImage).mockRejectedValue(new Error('User not found'))

            const response = await request(app).post('/api/user/img').expect(500)

            expect(response.status).toBe(500)
        })
    })

    describe('POST /api/user/files', () => {
        it('should upload multiple files successfully', async () => {
            const mockResults = ['uploaded-file-1', 'uploaded-file-2']

            vi.mocked(uploadMultipleFiles).mockResolvedValue(mockResults)

            const response = await request(app).post('/api/user/files').expect(200)

            expect(response.status).toBe(200)
            expect(uploadMultipleFiles).toHaveBeenCalledWith(expect.any(Array))
        })

        it('should handle upload errors', async () => {
            vi.mocked(uploadMultipleFiles).mockRejectedValue(new Error('Upload failed'))

            const response = await request(app).post('/api/user/files').expect(500)

            expect(response.status).toBe(500)
        })
    })

    describe('Authentication Middleware', () => {
        it('should pass user data to authenticated routes', async () => {
            const mockUserData = {
                userId: 'custom-user-id',
                email: 'custom@example.com',
                username: 'customuser',
                verified: false,
            }

            // Override the global mock for this test
            const originalMock = vi.mocked(verifycookie)
            vi.mocked(verifycookie).mockImplementationOnce(async (req: any, res: any, next: any) => {
                req.query = {
                    ...req.query,
                    user: mockUserData,
                }
                next()
            })

            const response = await request(app).get('/api/user').expect(200)

            expect(response.body).toEqual({
                user: mockUserData,
            })

            // Restore the original mock
            vi.mocked(verifycookie).mockImplementation(originalMock)
        })
    })

    describe('Service Integration', () => {
        it('should call user service methods correctly', async () => {
            const mockImageBuffer = Buffer.from('fake-image-data')

            vi.mocked(downloadProfileImage).mockResolvedValue(mockImageBuffer)

            await request(app).get('/api/user/img').expect(200)

            expect(downloadProfileImage).toHaveBeenCalledWith('test-user-id')
        })

        it('should handle service errors properly', async () => {
            vi.mocked(downloadProfileImage).mockRejectedValue(new Error('Service error'))

            const response = await request(app).get('/api/user/img').expect(500)

            expect(response.status).toBe(500)
        })
    })
})
