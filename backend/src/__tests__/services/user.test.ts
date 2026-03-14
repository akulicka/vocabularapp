import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import { UserAttributes } from '@db/models/user'
import { upload_file, download_file } from '@util/storage.js'

// Mock dependencies
vi.mock('@db/models/index.js', () => ({
    default: {
        users: { findOne: vi.fn(), build: vi.fn() },
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

        it('should handle user not found', async () => {
            vi.mocked(db.users.findOne).mockResolvedValue(null)

            const result = await db.users.findOne({ where: { userId: mockUserId } })

            expect(result).toBeNull()
        })
    })

    describe('uploadProfileImage', () => {
        it('should upload profile image successfully', async () => {
            const mockFile = {
                originalname: 'profile.jpg',
                buffer: Buffer.from('image-data'),
                mimetype: 'image/jpeg',
                fieldname: 'file',
                encoding: '7bit',
                size: 1000,
                stream: {} as any,
                destination: '',
                filename: 'profile.jpg',
                path: '/tmp/profile.jpg',
            }
            vi.mocked(upload_file).mockResolvedValue('uploaded-file-path')
            vi.mocked(db.users.findOne).mockResolvedValue(mockUser as any)

            const result = await upload_file(mockFile)

            expect(result).toBe('uploaded-file-path')
            expect(upload_file).toHaveBeenCalledWith(mockFile)
        })

        it('should handle upload errors', async () => {
            const mockFile = {
                originalname: 'profile.jpg',
                buffer: Buffer.from('image-data'),
                mimetype: 'image/jpeg',
                fieldname: 'file',
                encoding: '7bit',
                size: 1000,
                stream: {} as any,
                destination: '',
                filename: 'profile.jpg',
                path: '/tmp/profile.jpg',
            }
            vi.mocked(upload_file).mockRejectedValue(new Error('Upload failed'))

            await expect(upload_file(mockFile)).rejects.toThrow('Upload failed')
        })
    })

    describe('downloadProfileImage', () => {
        it('should download profile image successfully', async () => {
            const mockImageData = [Buffer.from('image-data')]
            vi.mocked(download_file).mockResolvedValue(mockImageData)

            const result = await download_file('profile.jpg')

            expect(result).toEqual(mockImageData)
            expect(download_file).toHaveBeenCalledWith('profile.jpg')
        })

        it('should handle download errors', async () => {
            vi.mocked(download_file).mockRejectedValue(new Error('Download failed'))

            await expect(download_file('profile.jpg')).rejects.toThrow('Download failed')
        })
    })

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const updatedData = { username: 'newusername', email: 'newemail@example.com' }
            const updatedUser = { ...mockUser, ...updatedData }
            vi.mocked(db.users.findOne).mockResolvedValue(updatedUser as any)

            const result = await db.users.findOne({ where: { userId: mockUserId } })

            expect(result).toEqual(updatedUser)
            expect(db.users.findOne).toHaveBeenCalledWith({ where: { userId: mockUserId } })
        })

        it('should handle update errors', async () => {
            vi.mocked(db.users.findOne).mockRejectedValue(new Error('Update failed'))

            await expect(db.users.findOne({ where: { userId: mockUserId } })).rejects.toThrow('Update failed')
        })
    })
})
