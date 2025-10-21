import { v4 as uuidv4 } from 'uuid'
import db from '@db/models/index.js'
import { upload_file, download_file } from '@util/storage.js'
import { UserAttributes } from '@db/models/user'

export interface UserProfile {
    userId: string
    username: string
    email: string
    verified: boolean
    profile_image?: string
}

export interface UpdateProfileRequest {
    username?: string
    email?: string
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')

    return {
        userId: (user as any).userId,
        username: (user as any).username,
        email: (user as any).email,
        verified: (user as any).verified || false,
        profile_image: (user as any).profile_image,
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')

    if (data.username) {
        ;(user as any).username = data.username
    }
    if (data.email) {
        ;(user as any).email = data.email
    }

    await user.save()
    return getUserProfile(userId)
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(userId: string, file: Express.Multer.File): Promise<string> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')

    // Set original filename to existing profile image or generate new UUID
    file.originalname = (user as any).profile_image || uuidv4()

    const uploadResult = await upload_file(file)

    // Only update if image name changed
    if ((user as any).profile_image !== file.originalname) {
        ;(user as any).profile_image = file.originalname
        await user.save()
    }

    return uploadResult[0]
}

/**
 * Download profile image
 */
export async function downloadProfileImage(userId: string): Promise<Buffer | null> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')

    if (!(user as any).profile_image) {
        return null
    }

    const imgBuffer = await download_file((user as any).profile_image)
    if (!Buffer.isBuffer(imgBuffer[0])) {
        throw new Error('Invalid image downloaded')
    }

    return imgBuffer[0]
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
        return []
    }

    const uploadPromises = files.map((file) => upload_file(file))
    const results = await Promise.all(uploadPromises)

    return results.map((result) => result[0])
}

/**
 * Check if user exists
 */
export async function userExists(userId: string): Promise<boolean> {
    const user = await db.users.findOne({ where: { userId } })
    return !!user
}

/**
 * Get user by ID (raw database result)
 */
export async function getUserById(userId: string): Promise<UserAttributes | null> {
    const user = await db.users.findOne({ where: { userId } })
    return user as UserAttributes | null
}

/**
 * Update user profile image reference
 */
export async function updateProfileImageReference(userId: string, imagePath: string): Promise<void> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')
    ;(user as any).profile_image = imagePath
    await user.save()
}

/**
 * Delete user profile image
 */
export async function deleteProfileImage(userId: string): Promise<void> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')
    ;(user as any).profile_image = null
    await user.save()
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{ createdAt: Date; lastLogin?: Date }> {
    const user = await db.users.findOne({ where: { userId } })
    if (!user) throw new Error('User not found')

    return {
        createdAt: (user as any).createdAt,
        lastLogin: (user as any).lastLogin,
    }
}
