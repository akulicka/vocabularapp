import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import sendMessage from '@util/email.js'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'

// Mock dependencies
vi.mock('form-data', () => ({
    default: vi.fn(() => ({})),
}))
vi.mock('mailgun.js', () => ({
    default: vi.fn(),
}))
vi.mock('nodemailer/lib/mail-composer/index.js', () => ({
    default: vi.fn(),
}))

describe('Email Utility', () => {
    const mockUser = { username: 'testuser', email: 'test@example.com', userId: 'test-user-id' }
    const mockTokenId = 'test-token-id'
    const mockSendMessageParams = { user: mockUser, token_id: mockTokenId }

    const mockMailgunClient = {
        messages: { create: vi.fn().mockResolvedValue({ id: 'message-id', message: 'Queued' }) },
    }
    const mockMailgun = { client: vi.fn().mockReturnValue(mockMailgunClient) }
    const mockMailComposer = {
        compile: vi.fn().mockReturnValue({
            build: vi.fn().mockImplementation((callback) => callback(null, Buffer.from('mock-message'))),
        }),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.MAILGUN_KEY = 'test-mailgun-key'
        process.env.MAILGUN_DOMAIN = 'test.mailgun.org'
        process.env.HOST_DOMAIN = 'https://test.example.com'

        // Mock the constructors properly
        ;(FormData as any).mockImplementation(() => ({}))
        ;(Mailgun as any).mockImplementation(() => mockMailgun)
        ;(MailComposer as any).mockImplementation(() => mockMailComposer)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('sendMessage', () => {
        it('should send email successfully', async () => {
            await sendMessage(mockSendMessageParams)

            expect(Mailgun).toHaveBeenCalledWith(expect.any(Function))
            expect(mockMailgun.client).toHaveBeenCalledWith({ username: 'api', key: 'test-mailgun-key' })
            expect(MailComposer).toHaveBeenCalledWith({
                from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                to: ['testuser <test@example.com>'],
                subject: 'verify your email',
                text: 'Thanks for signing up, testuser.  copy paste this link: https://test.example.com/test-user-id/verify/test-token-id to verify your email.',
                html: 'Thanks for signing up, testuser.  click <a href="https://test.example.com/test-user-id/verify/test-token-id">here</a> (or copy paste https://test.example.com/test-user-id/verify/test-token-id into your browser) to verify your email.',
            })
            expect(mockMailComposer.compile).toHaveBeenCalled()
        })

        it('should handle different user data and special characters', async () => {
            // Test different user
            const differentUser = { username: 'differentuser', email: 'different@example.com', userId: 'different-user-id' }
            await sendMessage({ user: differentUser, token_id: 'different-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['differentuser <different@example.com>'],
                    text: expect.stringContaining('differentuser'),
                }),
            )

            // Test special characters
            const specialUser = { username: 'user@#$%', email: 'special@example.com', userId: 'special-user-id' }
            await sendMessage({ user: specialUser, token_id: 'special-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['user@#$% <special@example.com>'],
                }),
            )

            // Test long username
            const longUser = { username: 'a'.repeat(100), email: 'long@example.com', userId: 'long-user-id' }
            await sendMessage({ user: longUser, token_id: 'long-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [`${'a'.repeat(100)} <long@example.com>`],
                }),
            )
        })

        it('should handle various error scenarios', async () => {
            // Mailgun initialization error
            vi.mocked(Mailgun).mockImplementation(() => {
                throw new Error('Mailgun init error')
            })
            await expect(sendMessage(mockSendMessageParams)).rejects.toThrow('Mailgun init error')

            // Reset the mock for other tests
            vi.mocked(Mailgun).mockImplementation(() => mockMailgun)

            // Mail composer error
            const errorComposer = {
                compile: vi.fn().mockReturnValue({
                    build: vi.fn().mockImplementation((callback) => callback(new Error('Composer error'), null)),
                }),
            }
            vi.mocked(MailComposer).mockImplementation(() => errorComposer as any)
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()

            // Message creation error
            mockMailgunClient.messages.create.mockRejectedValue(new Error('Message creation failed'))
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()

            // Missing env vars
            delete process.env.MAILGUN_KEY
            delete process.env.MAILGUN_DOMAIN
            delete process.env.HOST_DOMAIN
            await expect(sendMessage(mockSendMessageParams)).resolves.toBeUndefined()
        })
    })

    describe('Email Content and Edge Cases', () => {
        it('should generate correct email content', async () => {
            await sendMessage(mockSendMessageParams)

            const expectedLink = 'https://test.example.com/test-user-id/verify/test-token-id'
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(expectedLink),
                    html: expect.stringContaining(expectedLink),
                    from: 'Mailgun Sandbox <postmaster@test.mailgun.org>',
                    to: ['testuser <test@example.com>'],
                    subject: 'verify your email',
                }),
            )
        })

        it('should handle edge cases', async () => {
            // Empty username
            const emptyUser = { username: '', email: 'empty@example.com', userId: 'empty-user-id' }
            await sendMessage({ user: emptyUser, token_id: 'empty-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [' <empty@example.com>'],
                    text: expect.stringContaining('Thanks for signing up, .'),
                }),
            )

            // Empty email
            const emptyEmailUser = { username: 'emptyemail', email: '', userId: 'empty-email-id' }
            await sendMessage({ user: emptyEmailUser, token_id: 'empty-email-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['emptyemail <>'],
                }),
            )

            // Null properties
            const nullUser = { username: null as any, email: null as any, userId: null as any }
            await sendMessage({ user: nullUser, token_id: 'null-token-id' })
            expect(MailComposer).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['null <null>'],
                    text: expect.stringContaining('Thanks for signing up, null'),
                }),
            )
        })
    })
})
