import { describe, it, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Router } from 'express'
import { setRoutes } from '@routes/index.js'

vi.mock('@routes/auth/index', () => ({ default: Router() }))
vi.mock('@routes/token/index', () => ({ default: Router() }))
vi.mock('@routes/user/index', () => ({ default: Router() }))
vi.mock('@routes/word/index', () => ({ default: Router() }))
vi.mock('@routes/quiz/index', () => ({ default: Router() }))

describe('Health Route', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        setRoutes(app)
    })

    it('GET /health returns 200', async () => {
        await request(app).get('/health').expect(200)
    })
})
