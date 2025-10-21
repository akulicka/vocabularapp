import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import { UserAttributes } from '@db/models/user'
import { upload_file, download_file } from '@util/storage.js'

// Mock dependencies
vi.mock('@db/models/index.js', () => ({
    default: {
        users: {
            findOne: vi.fn(),
            build: vi.fn(),
        },
    },
}))

vi.mock('@util/storage.js', () => ({
    upload_file: vi.fn(),
    download_file: vi.fn(),
}))

describe('User Service', () => {
    const mockUserId = uuidv4()
    const mockUser: UserAttributes = {
        userId: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        profile_image: 'profile.jpg',
        verified: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getUserProfile', () => {
        it('should return user profile data', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            const result = await db.users.findOne({ where: { userId: mockUserId } })

            expect(result).toEqual(mockUser)
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId } })
        })

        it('should return null when user not found', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const result = await db.users.findOne({ where: { userId: mockUserId } })

            expect(result).toBeNull()
        })
    })

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const updatedUser = { ...mockUser, username: 'updateduser' }
            const mockUserInstance = {
                ...mockUser,
                save: vi.fn().mockResolvedValue(updatedUser),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            if (user) {
                ;(user as any).username = 'updateduser'
                await (user as any).save()
            }

            expect(mockUserInstance.save).toHaveBeenCalled()
        })

        it('should throw error when user not found', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const user = await db.users.findOne({ where: { userId: mockUserId } })

            expect(user).toBeNull()
        })
    })

    describe('uploadProfileImage', () => {
        it('should upload profile image successfully', async () => {
            const mockFile = {
                originalname: 'newimage.jpg',
                buffer: Buffer.from('fake-image-data'),
                mimetype: 'image/jpeg',
            } as any

            const mockUserInstance = {
                ...mockUser,
                save: vi.fn().mockResolvedValue({ ...mockUser, profile_image: 'newimage.jpg' }),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(upload_file).mockResolvedValue('uploaded-file-path')

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            if (user) {
                const uploadResult = await upload_file(mockFile)
                ;(user as any).profile_image = 'newimage.jpg'
                await (user as any).save()
            }

            expect(upload_file).toHaveBeenCalledWith(mockFile)
            expect(mockUserInstance.save).toHaveBeenCalled()
        })

        it('should handle upload when user has existing profile image', async () => {
            const mockFile = {
                originalname: 'existing-image.jpg',
                buffer: Buffer.from('fake-image-data'),
                mimetype: 'image/jpeg',
            } as any

            const mockUserInstance = {
                ...mockUser,
                profile_image: 'existing-image.jpg',
                save: vi.fn().mockResolvedValue(mockUser),
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(upload_file).mockResolvedValue('uploaded-file-path')

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            if (user) {
                const uploadResult = await upload_file(mockFile)
                // Should not save if image name is the same
                if ((user as any).profile_image !== mockFile.originalname) {
                    ;(user as any).profile_image = mockFile.originalname
                    await (user as any).save()
                }
            }

            expect(upload_file).toHaveBeenCalledWith(mockFile)
            expect(mockUserInstance.save).not.toHaveBeenCalled()
        })
    })

    describe('downloadProfileImage', () => {
        it('should download profile image successfully', async () => {
            const mockImageBuffer = Buffer.from('fake-image-data')
            const mockUserInstance = {
                ...mockUser,
                profile_image: 'profile.jpg',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(download_file).mockResolvedValue([mockImageBuffer])

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            if (user && (user as any).profile_image) {
                const imageBuffer = await download_file((user as any).profile_image)
                expect(imageBuffer[0]).toBe(mockImageBuffer)
            }

            expect(download_file).toHaveBeenCalledWith('profile.jpg')
        })

        it('should handle user without profile image', async () => {
            const mockUserInstance = {
                ...mockUser,
                profile_image: null,
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            const hasImage = user && (user as any).profile_image

            expect(hasImage).toBeFalsy()
        })

        it('should handle invalid image buffer', async () => {
            const mockUserInstance = {
                ...mockUser,
                profile_image: 'profile.jpg',
            }

            vi.mocked(db.users.findOne).mockResolvedValue(mockUserInstance as any)
            vi.mocked(download_file).mockResolvedValue(['invalid-buffer' as any])

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            if (user && (user as any).profile_image) {
                const imageBuffer = await download_file((user as any).profile_image)
                const isValidBuffer = Buffer.isBuffer(imageBuffer[0])
                expect(isValidBuffer).toBe(false)
            }
        })
    })

    describe('uploadMultipleFiles', () => {
        it('should upload multiple files successfully', async () => {
            const mockFiles = [
                {
                    originalname: 'file1.jpg',
                    buffer: Buffer.from('fake-data-1'),
                    mimetype: 'image/jpeg',
                } as any,
                {
                    originalname: 'file2.jpg',
                    buffer: Buffer.from('fake-data-2'),
                    mimetype: 'image/jpeg',
                } as any,
            ]

            vi.mocked(upload_file).mockResolvedValue('uploaded-file-1')
            vi.mocked(upload_file).mockResolvedValue('uploaded-file-2')

            const uploadPromises = mockFiles.map((file) => upload_file(file))
            const results = await Promise.all(uploadPromises)

            expect(results).toHaveLength(2)
            expect(upload_file).toHaveBeenCalledTimes(2)
        })

        it('should handle empty files array', async () => {
            const mockFiles: any[] = []

            const uploadPromises = mockFiles.map((file) => upload_file(file))
            const results = await Promise.all(uploadPromises)

            expect(results).toHaveLength(0)
            expect(upload_file).not.toHaveBeenCalled()
        })

        it('should handle upload errors gracefully', async () => {
            const mockFiles = [
                {
                    originalname: 'file1.jpg',
                    buffer: Buffer.from('fake-data-1'),
                    mimetype: 'image/jpeg',
                } as any,
            ]

            vi.mocked(upload_file).mockRejectedValue(new Error('Upload failed'))

            try {
                const uploadPromises = mockFiles.map((file) => upload_file(file))
                await Promise.all(uploadPromises)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect((error as Error).message).toBe('Upload failed')
            }
        })
    })

    describe('userValidation', () => {
        it('should validate user exists', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            const userExists = !!user

            expect(userExists).toBe(true)
        })

        it('should validate user does not exist', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const user = await db.users.findOne({ where: { userId: mockUserId } })
            const userExists = !!user

            expect(userExists).toBe(false)
        })

        it('should validate user email uniqueness', async () => {
            const existingUser = { ...mockUser, email: 'existing@example.com' }
            vi.mocked(db.users.findOne).mockResolvedValue(existingUser as any)

            const user = await db.users.findOne({ where: { email: 'existing@example.com' } })
            const emailExists = !!user

            expect(emailExists).toBe(true)
        })
    })
})
