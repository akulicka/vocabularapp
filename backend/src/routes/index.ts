import { Application } from 'express'
import AuthRouter from '@routes/auth/index'
import TokenRouter from '@routes/token/index'
import UserRouter from '@routes/user/index'
import WordRouter from '@routes/word/index'
import QuizRouter from '@routes/quiz/index'

export const setRoutes = (app: Application): void => {
    app.use('/user', UserRouter)
    app.use('/token', TokenRouter)
    app.use('/words', WordRouter)
    app.use('/quiz', QuizRouter)
    app.use('/', AuthRouter)
    console.log('routes set')
}
