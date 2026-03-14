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
    const mockSequelize = { transaction: vi.fn().mockResolvedValue(mockTransaction) }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(db.sequelize.transaction).mockResolvedValue(mockTransaction)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('withTransaction', () => {
        it('should execute callback successfully and commit transaction', async () => {
            const mockCallback = vi.fn().mockResolvedValue('success')
            const result = await withTransaction(mockCallback)

            expect(result).toBe('success')
            expect(db.sequelize.transaction).toHaveBeenCalled()
            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).toHaveBeenCalled()
            expect(mockTransaction.rollback).not.toHaveBeenCalled()
        })

        it('should handle callback errors and rollback transaction', async () => {
            const error = new Error('Callback failed')
            const mockCallback = vi.fn().mockRejectedValue(error)

            await expect(withTransaction(mockCallback)).rejects.toThrow('Callback failed')

            expect(mockCallback).toHaveBeenCalledWith(mockTransaction)
            expect(mockTransaction.commit).not.toHaveBeenCalled()
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle various callback return types', async () => {
            // Test different return values
            const testCases = [
                { callback: vi.fn().mockResolvedValue(undefined), expected: undefined },
                { callback: vi.fn().mockResolvedValue(null), expected: null },
                { callback: vi.fn().mockResolvedValue({ id: 1, data: 'test' }), expected: { id: 1, data: 'test' } },
                { callback: vi.fn().mockResolvedValue('string'), expected: 'string' },
            ]

            for (const testCase of testCases) {
                const result = await withTransaction(testCase.callback)
                expect(result).toEqual(testCase.expected)
                expect(mockTransaction.commit).toHaveBeenCalled()
                mockTransaction.commit.mockClear()
            }
        })

        it('should handle various error types', async () => {
            const errorCases = [
                {
                    callback: vi.fn().mockImplementation(() => {
                        throw 'String error'
                    }),
                    expected: 'String error',
                },
                {
                    callback: vi.fn().mockImplementation(() => {
                        throw null
                    }),
                    expected: null,
                },
                {
                    callback: vi.fn().mockImplementation(() => {
                        throw undefined
                    }),
                    expected: undefined,
                },
                {
                    callback: vi.fn().mockImplementation(() => {
                        throw { message: 'Custom', code: 'ERROR' }
                    }),
                    expected: { message: 'Custom', code: 'ERROR' },
                },
            ]

            for (const errorCase of errorCases) {
                await expect(withTransaction(errorCase.callback)).rejects.toEqual(errorCase.expected)
                expect(mockTransaction.rollback).toHaveBeenCalled()
                mockTransaction.rollback.mockClear()
            }
        })
    })

    describe('Transaction Management and Edge Cases', () => {
        it('should handle transaction management errors', async () => {
            // Transaction creation error
            vi.mocked(db.sequelize.transaction).mockRejectedValue(new Error('Transaction creation failed'))
            const mockCallback = vi.fn()
            await expect(withTransaction(mockCallback)).rejects.toThrow('Transaction creation failed')
            expect(mockCallback).not.toHaveBeenCalled()

            // Commit error
            vi.mocked(db.sequelize.transaction).mockResolvedValue(mockTransaction)
            mockTransaction.commit.mockRejectedValue(new Error('Commit failed'))
            const successCallback = vi.fn().mockResolvedValue('success')
            await expect(withTransaction(successCallback)).rejects.toThrow('Commit failed')
            expect(mockTransaction.commit).toHaveBeenCalled()

            // Rollback error (should still throw original error)
            mockTransaction.commit.mockResolvedValue(undefined)
            mockTransaction.rollback.mockRejectedValue(new Error('Rollback failed'))
            const errorCallback = vi.fn().mockRejectedValue(new Error('Callback failed'))
            await expect(withTransaction(errorCallback)).rejects.toThrow('Rollback failed')
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })

        it('should handle async operations and edge cases', async () => {
            // Async callback
            const asyncCallback = vi.fn().mockImplementation(async (transaction) => {
                await new Promise((resolve) => setTimeout(resolve, 10))
                return 'async-result'
            })
            const result = await withTransaction(asyncCallback)
            expect(result).toBe('async-result')
            expect(mockTransaction.commit).toHaveBeenCalled()

            // Non-promise return value
            const syncCallback = vi.fn().mockReturnValue('sync-result')
            const syncResult = await withTransaction(syncCallback)
            expect(syncResult).toBe('sync-result')

            // Promise that rejects
            const rejectCallback = vi.fn().mockResolvedValue(Promise.reject(new Error('Promise rejected')))
            await expect(withTransaction(rejectCallback)).rejects.toThrow('Promise rejected')
            expect(mockTransaction.rollback).toHaveBeenCalled()
        })
    })
})
