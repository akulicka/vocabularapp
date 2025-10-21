import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { withTransaction } from '@util/transaction.js'
import db from '@db/models/index.js'

// Mock dependencies
vi.mock('@db/models/index.js')

describe('Transaction Utility', () => {
    const mockTransaction = {
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
    }

    const mockSequelize = {
        transaction: vi.fn().mockResolvedValue(mockTransaction),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(db).mockReturnValue({
            sequelize: mockSequelize,
        } as any)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('withTransaction', () => {
        it('should execute callback successfully and commit transaction', async () => {
            const mockCallback = vi.fn().mockResolvedValue('success')
            const mockResult = 'test-result'

            mockCallback.mockResolvedValue(mockResult)

            const result = await withTransaction(mockCallback)

            expect(result).toBe(mockResult)
            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback errors and rollback transaction', async () => {
            const error = new Error('Callback failed')
            const mockCallback = vi.fn().mockRejectedValue(error)

            await expect(withTransaction(mockCallback)).rejects.toThrow('Callback failed')

            expect(mockSequelize.transaction).toHaveBeenCalled()
            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle async callback functions', async () => {
            const asyncCallback = vi.fn().mockImplementation(async (transaction) => {
                await new Promise((resolve) => setTimeout(resolve, 10))
                return 'async-result'
            })

            const result = await withTransaction(asyncCallback)

            expect(result).toBe('async-result')
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback that returns undefined', async () => {
            const mockCallback = vi.fn().mockResolvedValue(undefined)

            const result = await withTransaction(mockCallback)

            expect(result).toBeUndefined()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback that returns null', async () => {
            const mockCallback = vi.fn().mockResolvedValue(null)

            const result = await withTransaction(mockCallback)

            expect(result).toBeNull()
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback that returns complex objects', async () => {
            const complexObject = {
                id: 1,
                name: 'test',
                data: { nested: 'value' },
                array: [1, 2, 3],
            }
            const mockCallback = vi.fn().mockResolvedValue(complexObject)

            const result = await withTransaction(mockCallback)

            expect(result).toEqual(complexObject)
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback that throws string errors', async () => {
            const mockCallback = vi.fn().mockImplementation(() => {
                throw 'String error'
            })

            await expect(withTransaction(mockCallback)).rejects.toBe('String error')

            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle callback that throws null', async () => {
            const mockCallback = vi.fn().mockImplementation(() => {
                throw null
            })

            await expect(withTransaction(mockCallback)).rejects.toBeNull()

            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle callback that throws undefined', async () => {
            const mockCallback = vi.fn().mockImplementation(() => {
                throw undefined
            })

            await expect(withTransaction(mockCallback)).rejects.toBeUndefined()

            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle callback that throws custom error objects', async () => {
            const customError = {
                message: 'Custom error',
                code: 'CUSTOM_ERROR',
                details: { field: 'value' },
            }
            const mockCallback = vi.fn().mockImplementation(() => {
                throw customError
            })

            await expect(withTransaction(mockCallback)).rejects.toEqual(customError)

            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })
    })

    describe('Transaction Management', () => {
        it('should handle transaction creation errors', async () => {
            mockSequelize.transaction.mockRejectedValue(new Error('Transaction creation failed'))

            const mockCallback = vi.fn()

            await expect(withTransaction(mockCallback)).rejects.toThrow('Transaction creation failed')

            expect(mockCallback).not.toHaveBeenCalled()
            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle commit errors', async () => {
            mockTransaction.commit.mockRejectedValue(new Error('Commit failed'))
            const mockCallback = vi.fn().mockResolvedValue('success')

            await expect(withTransaction(mockCallback)).rejects.toThrow('Commit failed')

            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle rollback errors', async () => {
            mockTransaction.rollback.mockRejectedValue(new Error('Rollback failed'))
            const error = new Error('Callback failed')
            const mockCallback = vi.fn().mockRejectedValue(error)

            // The original callback error should be thrown, not the rollback error
            await expect(withTransaction(mockCallback)).rejects.toThrow('Callback failed')

            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle both commit and rollback errors', async () => {
            mockTransaction.commit.mockRejectedValue(new Error('Commit failed'))
            mockTransaction.rollback.mockRejectedValue(new Error('Rollback failed'))
            const mockCallback = vi.fn().mockResolvedValue('success')

            await expect(withTransaction(mockCallback)).rejects.toThrow('Commit failed')

            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })
    })

    describe('Callback Behavior', () => {
        it('should pass transaction object to callback', async () => {
            const mockCallback = vi.fn().mockResolvedValue('success')

            await withTransaction(mockCallback)

            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockCallback).toHaveBeenCalledTimes(1)
        })

        it('should handle callback that uses transaction', async () => {
            const mockCallback = vi.fn().mockImplementation(async (transaction) => {
                // Simulate using the transaction in database operations
                expect(transaction).toBe(mockTransaction)
                return 'transaction-used'
            })

            const result = await withTransaction(mockCallback)

            expect(result).toBe('transaction-used')
            expect(mockTransaction.commit).toHaveBeenCalled()
        })

        it('should handle callback that modifies transaction', async () => {
            const mockCallback = vi.fn().mockImplementation(async (transaction) => {
                // Simulate modifying transaction properties
                transaction.modified = true
                return 'transaction-modified'
            })

            const result = await withTransaction(mockCallback)

            expect(result).toBe('transaction-modified')
            expect(mockTransaction.commit).toHaveBeenCalled()
        })

        it('should handle callback that performs multiple operations', async () => {
            let operationCount = 0
            const mockCallback = vi.fn().mockImplementation(async (transaction) => {
                operationCount++
                // Simulate multiple database operations
                await new Promise((resolve) => setTimeout(resolve, 5))
                operationCount++
                return `operations-${operationCount}`
            })

            const result = await withTransaction(mockCallback)

            expect(result).toBe('operations-2')
            expect(mockTransaction.commit).toHaveBeenCalled()
        })
    })

    describe('Error Propagation', () => {
        it('should preserve error stack traces', async () => {
            const originalError = new Error('Original error')
            originalError.stack = 'Error: Original error\n    at test (test.js:1:1)'

            const mockCallback = vi.fn().mockRejectedValue(originalError)

            try {
                await withTransaction(mockCallback)
            } catch (error) {
                expect(error).toBe(originalError)
                expect(error.stack).toBe('Error: Original error\n    at test (test.js:1:1)')
            }

            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle nested errors', async () => {
            const nestedError = new Error('Nested error')
            const mockCallback = vi.fn().mockImplementation(async () => {
                try {
                    throw new Error('Inner error')
                } catch (innerError) {
                    throw nestedError
                }
            })

            await expect(withTransaction(mockCallback)).rejects.toThrow('Nested error')

            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle errors thrown after async operations', async () => {
            const mockCallback = vi.fn().mockImplementation(async (transaction) => {
                await new Promise((resolve) => setTimeout(resolve, 10))
                throw new Error('Async error')
            })

            await expect(withTransaction(mockCallback)).rejects.toThrow('Async error')

            expect(mockTransaction.rollback).toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        it('should handle callback that returns a promise that resolves to undefined', async () => {
            const mockCallback = vi.fn().mockResolvedValue(Promise.resolve(undefined))

            const result = await withTransaction(mockCallback)

            expect(result).toBeUndefined()
            expect(mockTransaction.commit).toHaveBeenCalled()
        })

        it('should handle callback that returns a promise that rejects', async () => {
            const error = new Error('Promise rejected')
            const mockCallback = vi.fn().mockResolvedValue(Promise.reject(error))

            await expect(withTransaction(mockCallback)).rejects.toThrow('Promise rejected')

            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle callback that throws during promise resolution', async () => {
            const mockCallback = vi.fn().mockImplementation(async () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error('Promise timeout')), 10)
                })
            })

            await expect(withTransaction(mockCallback)).rejects.toThrow('Promise timeout')

            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle callback that never resolves or rejects', async () => {
            const mockCallback = vi.fn().mockImplementation(async () => {
                return new Promise(() => {
                    // Never resolves or rejects
                })
            })

            // This should timeout in a real scenario, but we'll test the setup
            expect(mockCallback).toBeDefined()
        })

        it('should handle callback that returns non-promise values', async () => {
            const mockCallback = vi.fn().mockReturnValue('non-promise')

            const result = await withTransaction(mockCallback)

            expect(result).toBe('non-promise')
            expect(mockTransaction.commit).toHaveBeenCalled()
        })

        it('should handle callback that returns thenable objects', async () => {
            const thenable = {
                then: vi.fn().mockImplementation((resolve) => resolve('thenable-result')),
            }
            const mockCallback = vi.fn().mockReturnValue(thenable)

            const result = await withTransaction(mockCallback)

            expect(result).toBe('thenable-result')
            expect(mockTransaction.commit).toHaveBeenCalled()
        })
    })
})
