import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getAllTags, getTagById, createTag, updateTag, deleteTag } from '@services/tag.js'
import db from '@db/models/index.js'
import { withTransaction } from '@util/transaction.js'
import { TagDTO } from '@types'

// Mock dependencies
vi.mock('@db/models/index.js')
vi.mock('@util/transaction.js')

describe('Tag Service', () => {
    const mockUserId = 'test-user-id'
    const mockTagId = 'test-tag-id'
    const mockTagName = 'test-tag'

    const mockTagDTO: TagDTO = {
        tagId: mockTagId,
        tagName: mockTagName,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const mockTagInstance = {
        tagId: mockTagId,
        tagName: mockTagName,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        get: vi.fn().mockReturnValue(mockTagDTO),
        save: vi.fn().mockResolvedValue({}),
        setWords: vi.fn().mockResolvedValue({}),
        destroy: vi.fn().mockResolvedValue({}),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getAllTags', () => {
        it('should return all tags successfully', async () => {
            const mockTags = [mockTagInstance, { ...mockTagInstance, tagId: 'tag2', tagName: 'tag2' }]
            vi.mocked(db.tags.findAll).mockResolvedValue(mockTags as any)

            const result = await getAllTags()

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual(mockTagDTO)
            expect(db.tags.findAll).toHaveBeenCalled()
        })

        it('should return empty array when no tags exist', async () => {
            vi.mocked(db.tags.findAll).mockResolvedValue([])

            const result = await getAllTags()

            expect(result).toEqual([])
        })

        it('should handle database errors', async () => {
            vi.mocked(db.tags.findAll).mockRejectedValue(new Error('Database error'))

            await expect(getAllTags()).rejects.toThrow('Database error')
        })
    })

    describe('getTagById', () => {
        it('should return tag by ID successfully', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagInstance as any)

            const result = await getTagById(mockTagId)

            expect(result).toEqual(mockTagDTO)
            expect(db.tags.findOne).toHaveBeenCalledWith({ where: { tagId: mockTagId } })
        })

        it('should throw error when tag does not exist', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)

            await expect(getTagById('non-existent-tag')).rejects.toThrow('tag does not exist')
        })

        it('should handle database errors', async () => {
            vi.mocked(db.tags.findOne).mockRejectedValue(new Error('Database error'))

            await expect(getTagById(mockTagId)).rejects.toThrow('Database error')
        })
    })

    describe('createTag', () => {
        it('should create tag successfully', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null) // No existing tag
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            const result = await createTag(mockTagName, mockUserId)

            expect(result).toEqual(mockTagDTO)
            expect(db.tags.findOne).toHaveBeenCalledWith({ where: { tagName: mockTagName } })
            expect(db.tags.build).toHaveBeenCalledWith({
                tagId: expect.any(String),
                tagName: mockTagName,
                createdBy: mockUserId,
            })
            expect(mockTagInstance.save).toHaveBeenCalled()
        })

        it('should throw error for duplicate tag name', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagInstance as any)

            await expect(createTag(mockTagName, mockUserId)).rejects.toThrow('duplicate tag name')
        })

        it('should handle database errors during name check', async () => {
            vi.mocked(db.tags.findOne).mockRejectedValue(new Error('Database error'))

            await expect(createTag(mockTagName, mockUserId)).rejects.toThrow('Database error')
        })

        it('should handle database errors during save', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue({
                ...mockTagInstance,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            } as any)

            await expect(createTag(mockTagName, mockUserId)).rejects.toThrow('Save error')
        })

        it('should generate unique tag ID', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            await createTag(mockTagName, mockUserId)

            const buildCall = vi.mocked(db.tags.build).mock.calls[0][0]
            expect(buildCall.tagId).toBeDefined()
            expect(buildCall.tagId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })
    })

    describe('updateTag', () => {
        it('should update tag successfully', async () => {
            const updatedTagName = 'updated-tag-name'
            const updatedMockTag = {
                ...mockTagInstance,
                tagName: updatedTagName,
                get: vi.fn().mockReturnValue({ ...mockTagDTO, tagName: updatedTagName }),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(updatedMockTag as any)

            const result = await updateTag(mockTagId, updatedTagName)

            expect(result.tagName).toBe(updatedTagName)
            expect(db.tags.findOne).toHaveBeenCalledWith({ where: { tagId: mockTagId } })
            expect(updatedMockTag.save).toHaveBeenCalled()
        })

        it('should throw error when tag does not exist', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)

            await expect(updateTag('non-existent-tag', 'new-name')).rejects.toThrow('tag does not exist')
        })

        it('should handle database errors during find', async () => {
            vi.mocked(db.tags.findOne).mockRejectedValue(new Error('Database error'))

            await expect(updateTag(mockTagId, 'new-name')).rejects.toThrow('Database error')
        })

        it('should handle database errors during save', async () => {
            const mockTagWithError = {
                ...mockTagInstance,
                save: vi.fn().mockRejectedValue(new Error('Save error')),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagWithError as any)

            await expect(updateTag(mockTagId, 'new-name')).rejects.toThrow('Save error')
        })

        it('should update tag name correctly', async () => {
            const newTagName = 'completely-new-name'
            const mockTagToUpdate = {
                ...mockTagInstance,
                tagName: mockTagName,
                get: vi.fn().mockReturnValue({ ...mockTagDTO, tagName: newTagName }),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagToUpdate as any)

            await updateTag(mockTagId, newTagName)

            expect(mockTagToUpdate.tagName).toBe(newTagName)
        })
    })

    describe('deleteTag', () => {
        it('should delete tag successfully', async () => {
            const mockTransaction = { id: 'transaction-id' }
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback(mockTransaction)
            })

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagInstance as any)

            await deleteTag(mockTagId)

            expect(withTransaction).toHaveBeenCalled()
            expect(db.tags.findOne).toHaveBeenCalledWith({ where: { tagId: mockTagId } })
            expect(mockTagInstance.setWords).toHaveBeenCalledWith([], { transaction: mockTransaction })
            expect(mockTagInstance.destroy).toHaveBeenCalledWith({ transaction: mockTransaction })
        })

        it('should throw error when tag does not exist', async () => {
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback({})
            })

            vi.mocked(db.tags.findOne).mockResolvedValue(null)

            await expect(deleteTag('non-existent-tag')).rejects.toThrow('tag does not exist')
        })

        it('should handle database errors during find', async () => {
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback({})
            })

            vi.mocked(db.tags.findOne).mockRejectedValue(new Error('Database error'))

            await expect(deleteTag(mockTagId)).rejects.toThrow('Database error')
        })

        it('should handle errors during word removal', async () => {
            const mockTransaction = { id: 'transaction-id' }
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback(mockTransaction)
            })

            const mockTagWithError = {
                ...mockTagInstance,
                setWords: vi.fn().mockRejectedValue(new Error('Set words error')),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagWithError as any)

            await expect(deleteTag(mockTagId)).rejects.toThrow('Set words error')
        })

        it('should handle errors during destroy', async () => {
            const mockTransaction = { id: 'transaction-id' }
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback(mockTransaction)
            })

            const mockTagWithError = {
                ...mockTagInstance,
                destroy: vi.fn().mockRejectedValue(new Error('Destroy error')),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagWithError as any)

            await expect(deleteTag(mockTagId)).rejects.toThrow('Destroy error')
        })

        it('should use transaction for all operations', async () => {
            const mockTransaction = { id: 'transaction-id' }
            vi.mocked(withTransaction).mockImplementation(async (callback) => {
                return await callback(mockTransaction)
            })

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagInstance as any)

            await deleteTag(mockTagId)

            expect(mockTagInstance.setWords).toHaveBeenCalledWith([], { transaction: mockTransaction })
            expect(mockTagInstance.destroy).toHaveBeenCalledWith({ transaction: mockTransaction })
        })
    })

    describe('Tag Validation', () => {
        it('should handle empty tag name', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            await createTag('', mockUserId)

            expect(db.tags.build).toHaveBeenCalledWith({
                tagId: expect.any(String),
                tagName: '',
                createdBy: mockUserId,
            })
        })

        it('should handle special characters in tag name', async () => {
            const specialTagName = 'tag-with-special-chars!@#$%'
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            await createTag(specialTagName, mockUserId)

            expect(db.tags.build).toHaveBeenCalledWith({
                tagId: expect.any(String),
                tagName: specialTagName,
                createdBy: mockUserId,
            })
        })

        it('should handle very long tag names', async () => {
            const longTagName = 'a'.repeat(1000)
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            await createTag(longTagName, mockUserId)

            expect(db.tags.build).toHaveBeenCalledWith({
                tagId: expect.any(String),
                tagName: longTagName,
                createdBy: mockUserId,
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle concurrent tag creation', async () => {
            // Simulate race condition where two tags with same name are created simultaneously
            vi.mocked(db.tags.findOne)
                .mockResolvedValueOnce(null) // First check passes
                .mockResolvedValueOnce(mockTagInstance) // Second check finds existing tag

            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            // First call should succeed
            await createTag(mockTagName, mockUserId)

            // Second call should fail
            await expect(createTag(mockTagName, mockUserId)).rejects.toThrow('duplicate tag name')
        })

        it('should handle tag with null createdBy', async () => {
            vi.mocked(db.tags.findOne).mockResolvedValue(null)
            vi.mocked(db.tags.build).mockReturnValue(mockTagInstance as any)

            await createTag(mockTagName, '')

            expect(db.tags.build).toHaveBeenCalledWith({
                tagId: expect.any(String),
                tagName: mockTagName,
                createdBy: '',
            })
        })

        it('should handle update with same name', async () => {
            const mockTagToUpdate = {
                ...mockTagInstance,
                tagName: mockTagName,
                get: vi.fn().mockReturnValue({ ...mockTagDTO, tagName: mockTagName }),
            }

            vi.mocked(db.tags.findOne).mockResolvedValue(mockTagToUpdate as any)

            const result = await updateTag(mockTagId, mockTagName)

            expect(result.tagName).toBe(mockTagName)
            expect(mockTagToUpdate.save).toHaveBeenCalled()
        })
    })
})
