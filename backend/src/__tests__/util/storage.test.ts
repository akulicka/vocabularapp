import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PassThrough } from 'stream'
import { Storage } from '@google-cloud/storage'
import { download_file, upload_file } from '@util/storage.js'

// Mock dependencies
vi.mock('@google-cloud/storage')
vi.mock('stream')

describe('Storage Utility', () => {
    const mockFileId = 'test-file-id'
    const mockBucketId = 'test-bucket'
    const mockProjectId = 'test-project'

    const mockFile = {
        originalname: 'test-image.jpg',
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
    }

    const mockBucket = {
        file: vi.fn(),
    }

    const mockRemoteFile = {
        download: vi.fn(),
        createWriteStream: vi.fn(),
    }

    const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket),
    }

    const mockWriteStream = {
        on: vi.fn(),
        pipe: vi.fn().mockReturnThis(),
    }

    const mockPassThrough = {
        write: vi.fn(),
        end: vi.fn(),
        pipe: vi.fn().mockReturnThis(),
    }

    beforeEach(() => {
        vi.clearAllMocks()

        // Set up environment variables
        process.env.IMAGE_BUCKET = mockBucketId
        process.env.STORAGE_CLOUD_PROJECT = mockProjectId

        // Mock the modules
        vi.mocked(Storage).mockImplementation(() => mockStorage as any)
        vi.mocked(PassThrough).mockImplementation(() => mockPassThrough as any)

        // Set up default mocks
        mockBucket.file.mockReturnValue(mockRemoteFile)
        mockRemoteFile.createWriteStream.mockReturnValue(mockWriteStream)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('download_file', () => {
        it('should download file successfully', async () => {
            const mockContents = [Buffer.from('file-content')]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file(mockFileId)

            expect(result).toEqual(mockContents)
            expect(mockStorage.bucket).toHaveBeenCalledWith(mockBucketId)
            expect(mockBucket.file).toHaveBeenCalledWith(mockFileId)
            expect(mockRemoteFile.download).toHaveBeenCalled()
        })

        it('should handle multiple file chunks', async () => {
            const mockContents = [Buffer.from('chunk1'), Buffer.from('chunk2'), Buffer.from('chunk3')]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file(mockFileId)

            expect(result).toEqual(mockContents)
            expect(result).toHaveLength(3)
        })

        it('should handle empty file', async () => {
            const mockContents = [Buffer.alloc(0)]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file(mockFileId)

            expect(result).toEqual(mockContents)
            expect(result[0]).toHaveLength(0)
        })

        it('should handle download errors', async () => {
            mockRemoteFile.download.mockRejectedValue(new Error('Download failed'))

            await expect(download_file(mockFileId)).rejects.toThrow('Download failed')
        })

        it('should handle bucket access errors', async () => {
            mockStorage.bucket.mockImplementation(() => {
                throw new Error('Bucket access denied')
            })

            await expect(download_file(mockFileId)).rejects.toThrow('Bucket access denied')
        })

        it('should handle file not found errors', async () => {
            mockBucket.file.mockImplementation(() => {
                throw new Error('File not found')
            })

            await expect(download_file('non-existent-file')).rejects.toThrow('File not found')
        })

        it('should handle missing environment variables', async () => {
            delete process.env.IMAGE_BUCKET

            await expect(download_file(mockFileId)).rejects.toThrow()
        })

        it('should handle different file IDs', async () => {
            const differentFileId = 'different-file-id'
            const mockContents = [Buffer.from('different-content')]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file(differentFileId)

            expect(result).toEqual(mockContents)
            expect(mockBucket.file).toHaveBeenCalledWith(differentFileId)
        })
    })

    describe('upload_file', () => {
        it('should upload file successfully', async () => {
            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(mockFile)

            expect(result).toBe('upload of test-image.jpg complete')
            expect(mockStorage.bucket).toHaveBeenCalledWith(mockBucketId)
            expect(mockBucket.file).toHaveBeenCalledWith(mockFile.originalname)
            expect(mockPassThrough.write).toHaveBeenCalledWith(mockFile.buffer)
            expect(mockPassThrough.end).toHaveBeenCalled()
            expect(mockPassThrough.pipe).toHaveBeenCalledWith(mockWriteStream)
        })

        it('should handle upload errors', async () => {
            const uploadError = new Error('Upload failed')
            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(uploadError), 0)
                }
                return mockWriteStream
            })

            await expect(upload_file(mockFile)).rejects.toBe('err test-image.jpg Upload failed')
        })

        it('should handle different file types', async () => {
            const pngFile = {
                originalname: 'test-image.png',
                buffer: Buffer.from('fake-png-data'),
                mimetype: 'image/png',
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(pngFile)

            expect(result).toBe('upload of test-image.png complete')
            expect(mockBucket.file).toHaveBeenCalledWith('test-image.png')
        })

        it('should handle files with special characters in name', async () => {
            const specialFile = {
                originalname: 'test-image@#$%.jpg',
                buffer: Buffer.from('fake-data'),
                mimetype: 'image/jpeg',
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(specialFile)

            expect(result).toBe('upload of test-image@#$%.jpg complete')
            expect(mockBucket.file).toHaveBeenCalledWith('test-image@#$%.jpg')
        })

        it('should handle empty file buffer', async () => {
            const emptyFile = {
                originalname: 'empty-file.jpg',
                buffer: Buffer.alloc(0),
                mimetype: 'image/jpeg',
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(emptyFile)

            expect(result).toBe('upload of empty-file.jpg complete')
            expect(mockPassThrough.write).toHaveBeenCalledWith(Buffer.alloc(0))
        })

        it('should handle large file buffers', async () => {
            const largeFile = {
                originalname: 'large-file.jpg',
                buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
                mimetype: 'image/jpeg',
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(largeFile)

            expect(result).toBe('upload of large-file.jpg complete')
            expect(mockPassThrough.write).toHaveBeenCalledWith(largeFile.buffer)
        })

        it('should handle bucket access errors', async () => {
            mockStorage.bucket.mockImplementation(() => {
                throw new Error('Bucket access denied')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('Bucket access denied')
        })

        it('should handle file creation errors', async () => {
            mockBucket.file.mockImplementation(() => {
                throw new Error('File creation failed')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('File creation failed')
        })

        it('should handle write stream creation errors', async () => {
            mockRemoteFile.createWriteStream.mockImplementation(() => {
                throw new Error('Write stream creation failed')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('Write stream creation failed')
        })

        it('should handle missing environment variables', async () => {
            delete process.env.IMAGE_BUCKET

            await expect(upload_file(mockFile)).rejects.toThrow()
        })

        it('should handle PassThrough stream errors', async () => {
            vi.mocked(PassThrough).mockImplementation(() => {
                throw new Error('PassThrough creation failed')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('PassThrough creation failed')
        })
    })

    describe('Stream Handling', () => {
        it('should properly chain stream operations', async () => {
            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            await upload_file(mockFile)

            expect(mockPassThrough.write).toHaveBeenCalledWith(mockFile.buffer)
            expect(mockPassThrough.end).toHaveBeenCalled()
            expect(mockPassThrough.pipe).toHaveBeenCalledWith(mockWriteStream)
        })

        it('should handle stream pipe errors', async () => {
            mockPassThrough.pipe.mockImplementation(() => {
                throw new Error('Pipe error')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('Pipe error')
        })

        it('should handle stream write errors', async () => {
            mockPassThrough.write.mockImplementation(() => {
                throw new Error('Write error')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('Write error')
        })

        it('should handle stream end errors', async () => {
            mockPassThrough.end.mockImplementation(() => {
                throw new Error('End error')
            })

            await expect(upload_file(mockFile)).rejects.toThrow('End error')
        })
    })

    describe('Error Handling', () => {
        it('should handle network timeouts', async () => {
            mockRemoteFile.download.mockRejectedValue(new Error('Network timeout'))

            await expect(download_file(mockFileId)).rejects.toThrow('Network timeout')
        })

        it('should handle permission errors', async () => {
            mockRemoteFile.download.mockRejectedValue(new Error('Permission denied'))

            await expect(download_file(mockFileId)).rejects.toThrow('Permission denied')
        })

        it('should handle quota exceeded errors', async () => {
            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('Quota exceeded')), 0)
                }
                return mockWriteStream
            })

            await expect(upload_file(mockFile)).rejects.toBe('err test-image.jpg Quota exceeded')
        })

        it('should handle invalid file format errors', async () => {
            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('Invalid file format')), 0)
                }
                return mockWriteStream
            })

            await expect(upload_file(mockFile)).rejects.toBe('err test-image.jpg Invalid file format')
        })
    })

    describe('Edge Cases', () => {
        it('should handle null file buffer', async () => {
            const nullBufferFile = {
                originalname: 'null-buffer.jpg',
                buffer: null as any,
                mimetype: 'image/jpeg',
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(nullBufferFile)

            expect(result).toBe('upload of null-buffer.jpg complete')
            expect(mockPassThrough.write).toHaveBeenCalledWith(null)
        })

        it('should handle undefined file properties', async () => {
            const undefinedFile = {
                originalname: undefined as any,
                buffer: undefined as any,
                mimetype: undefined as any,
            }

            mockWriteStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    setTimeout(() => callback(), 0)
                }
                return mockWriteStream
            })

            const result = await upload_file(undefinedFile)

            expect(result).toBe('upload of undefined complete')
            expect(mockBucket.file).toHaveBeenCalledWith(undefined)
        })

        it('should handle empty file ID', async () => {
            const mockContents = [Buffer.from('content')]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file('')

            expect(result).toEqual(mockContents)
            expect(mockBucket.file).toHaveBeenCalledWith('')
        })

        it('should handle very long file IDs', async () => {
            const longFileId = 'a'.repeat(1000)
            const mockContents = [Buffer.from('content')]
            mockRemoteFile.download.mockResolvedValue(mockContents)

            const result = await download_file(longFileId)

            expect(result).toEqual(mockContents)
            expect(mockBucket.file).toHaveBeenCalledWith(longFileId)
        })
    })
})
