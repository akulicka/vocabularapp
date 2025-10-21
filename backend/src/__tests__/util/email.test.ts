import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import sendMessage from '@util/email.js'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'

// Mock dependencies
vi.mock('form-data')
vi.mock('mailgun.js')
vi.mock('nodemailer/lib/mail-composer/index.js')

describe('Email Utility', () => {
    const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        userId: 'test-user-id',
    }

    const mockTokenId = 'test-token-id'

    const mockSendMessageParams = {
        user: mockUser,
        token_id: mockTokenId,
    }

    const mockMailgunClient = {
        messages: {
            create: vi.fn().mockResolvedValue({ id: 'message-id', message: 'Queued' }),
        },
    }

    const mockMailgun = {
        client: vi.fn().mockReturnValue(mockMailgunClient),
    }

    const mockMailComposer = {
        compile: vi.fn().mockReturnValue({
            build: vi.fn().mockImplementation((callback) => {
                callback(null, Buffer.from('mock-message'))
            }),
        }),
    }

    beforeEach(() => {
        vi.clearAllMocks()

        // Set up environment variables
        process.env.MAILGUN_KEY = 'test-mailgun-key'
        process.env.MAILGUN_DOMAIN = 'test.mailgun.org'
        process.env.HOST_DOMAIN = 'https://test.example.com'

        // Mock the modules
        vi.mocked(FormData).mockImplementation(() => ({}) as any)
        vi.mocked(Mailgun).mockImplementation(() => mockMailgun as any)
        vi.mocked(MailComposer).mockImplementation(() => mockMailComposer as any)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('sendMessage', () => {
        it('should send email successfully', async () => {
            await sendMessage(mockSendMessageParams)

            expect(Mailgun).toHaveBeenCalledWith({})
            expect(mockMailgun.client).toHaveBeenCalledWith({
                username: 'api',
                key: 'test-mailgun-key',
            })
            expect(MailComposer).toHaveBeenCalledWith({
                from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                to: ['testuser <test@example.com>'],
                subject: 'verify your email',
                text: 'Thanks for signing up, testuser.  copy paste this link: https://test.example.com/test-user-id/verify/test-token-id to verify your email.',
                html: 'Thanks for signing up, testuser.  click <a href="https://test.example.com/test-user-id/verify/test-token-id">here</a> (or copy paste https://test.example.com/test-user-id/verify/test-token-id into your browser) to verify your email.',
            })
            expect(mockMailComposer.compile).toHaveBeenCalled()
        })

        it('should handle different user data', async () => {
            const differentUser = {
                username: 'differentuser',
                email: 'different@example.com',
                userId: 'different-user-id',
            }

            await sendMessage({
                user: differentUser,
                token_id: 'different-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith({
                from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                to: ['differentuser <different@example.com>'],
                subject: 'verify your email',
                text: 'Thanks for signing up, differentuser.  copy paste this link: https://test.example.com/different-user-id/verify/different-token-id to verify your email.',
                html: 'Thanks for signing up, differentuser.  click <a href="https://test.example.com/different-user-id/verify/different-token-id">here</a> (or copy paste https://test.example.com/different-user-id/verify/different-token-id into your browser) to verify your email.',
            })
        })

        it('should handle special characters in username', async () => {
            const specialUser = {
                username: 'user@#$%',
                email: 'special@example.com',
                userId: 'special-user-id',
            }

            await sendMessage({
                user: specialUser,
                token_id: 'special-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith({
                from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                to: ['user@#$% <special@example.com>'],
                subject: 'verify your email',
                text: 'Thanks for signing up, user@#$%.  copy paste this link: https://test.example.com/special-user-id/verify/special-token-id to verify your email.',
                html: 'Thanks for signing up, user@#$%.  click <a href="https://test.example.com/special-user-id/verify/special-token-id">here</a> (or copy paste https://test.example.com/special-user-id/verify/special-token-id into your browser) to verify your email.',
            })
        })

        it('should handle long usernames', async () => {
            const longUsername = 'a'.repeat(100)
            const longUser = {
                username: longUsername,
                email: 'long@example.com',
                userId: 'long-user-id',
            }

            await sendMessage({
                user: longUser,
                token_id: 'long-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith({
                from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                to: [`${longUsername} <long@example.com>`],
                subject: 'verify your email',
                text: `Thanks for signing up, ${longUsername}.  copy paste this link: https://test.example.com/long-user-id/verify/long-token-id to verify your email.`,
                html: `Thanks for signing up, ${longUsername}.  click <a href="https://test.example.com/long-user-id/verify/long-token-id">here</a> (or copy paste https://test.example.com/long-user-id/verify/long-token-id into your browser) to verify your email.`,
            })
        })

        it('should handle mailgun client creation errors', async () => {
            vi.mocked(Mailgun).mockImplementation(() => {
                throw new Error('Mailgun initialization error')
            })

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle mail composer errors', async () => {
            const mockMailComposerWithError = {
                compile: vi.fn().mockReturnValue({
                    build: vi.fn().mockImplementation((callback) => {
                        callback(new Error('Composer error'), null)
                    }),
                }),
            }

            vi.mocked(MailComposer).mockImplementation(() => mockMailComposerWithError as any)

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle mailgun message creation errors', async () => {
            mockMailgunClient.messages.create.mockRejectedValue(new Error('Message creation failed'))

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle missing environment variables', async () => {
            delete process.env.MAILGUN_KEY
            delete process.env.MAILGUN_DOMAIN
            delete process.env.HOST_DOMAIN

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle undefined environment variables', async () => {
            process.env.MAILGUN_KEY = undefined as any
            process.env.MAILGUN_DOMAIN = undefined as any
            process.env.HOST_DOMAIN = undefined as any

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })
    })

    describe('Email Content Generation', () => {
        it('should generate correct verification link', async () => {
            await sendMessage(mockSendMessageParams)

            const expectedLink = 'https://test.example.com/test-user-id/verify/test-token-id'

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(expectedLink),
                    html: expect.stringContaining(expectedLink),
                }),
            )
        })

        it('should generate correct HTML link', async () => {
            await sendMessage(mockSendMessageParams)

            const expectedHtmlLink = '<a href="https://test.example.com/test-user-id/verify/test-token-id">here</a>'

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining(expectedHtmlLink),
                }),
            )
        })

        it('should include both text and HTML versions', async () => {
            await sendMessage(mockSendMessageParams)

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.any(String),
                    html: expect.any(String),
                }),
            )
        })

        it('should use correct sender address', async () => {
            await sendMessage(mockSendMessageParams)

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                }),
            )
        })

        it('should use correct recipient format', async () => {
            await sendMessage(mockSendMessageParams)

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['testuser <test@example.com>'],
                }),
            )
        })

        it('should use correct subject', async () => {
            await sendMessage(mockSendMessageParams)

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'verify your email',
                }),
            )
        })
    })

    describe('Error Handling', () => {
        it('should handle FormData initialization errors', async () => {
            vi.mocked(FormData).mockImplementation(() => {
                throw new Error('FormData error')
            })

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle Mailgun constructor errors', async () => {
            vi.mocked(Mailgun).mockImplementation(() => {
                throw new Error('Mailgun constructor error')
            })

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle MailComposer constructor errors', async () => {
            vi.mocked(MailComposer).mockImplementation(() => {
                throw new Error('MailComposer constructor error')
            })

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })

        it('should handle async callback errors', async () => {
            const mockMailComposerWithAsyncError = {
                compile: vi.fn().mockReturnValue({
                    build: vi.fn().mockImplementation((callback) => {
                        // Simulate async error
                        setTimeout(() => {
                            callback(new Error('Async error'), null)
                        }, 0)
                    }),
                }),
            }

            vi.mocked(MailComposer).mockImplementation(() => mockMailComposerWithAsyncError as any)

            // Should not throw, just log error
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty username', async () => {
            const emptyUsernameUser = {
                username: '',
                email: 'empty@example.com',
                userId: 'empty-user-id',
            }

            await sendMessage({
                user: emptyUsernameUser,
                token_id: 'empty-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [' <empty@example.com>'],
                    text: expect.stringContaining('Thanks for signing up, .'),
                    html: expect.stringContaining('Thanks for signing up, .'),
                }),
            )
        })

        it('should handle empty email', async () => {
            const emptyEmailUser = {
                username: 'emptyemail',
                email: '',
                userId: 'empty-email-id',
            }

            await sendMessage({
                user: emptyEmailUser,
                token_id: 'empty-email-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['emptyemail <>'],
                }),
            )
        })

        it('should handle empty token ID', async () => {
            await sendMessage({
                user: mockUser,
                token_id: '',
            })

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('/verify/'),
                    html: expect.stringContaining('/verify/'),
                }),
            )
        })

        it('should handle null user properties', async () => {
            const nullUser = {
                username: null as any,
                email: null as any,
                userId: null as any,
            }

            await sendMessage({
                user: nullUser,
                token_id: 'null-token-id',
            })

            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['null <null>'],
                    text: expect.stringContaining('Thanks for signing up, null'),
                    html: expect.stringContaining('Thanks for signing up, null'),
                }),
            )
        })
    })
})
