import AuthRouter from './auth/index.js'
import TokenRouter from './token/index.js'
import UserRouter from './user/index.js'
import WordRouter from './word/index.js'
import QuizRouter from './quiz.js/index.js'

export const setRoutes = (app) => {
    app.use('/user', UserRouter)
    app.use('/token', TokenRouter)
    app.use('/words', WordRouter)
    app.use('/quiz', QuizRouter)
    app.use('/', AuthRouter)
    console.log('routes set')
}
