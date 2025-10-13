import AuthRouter from '@/routes/auth/index.js'
import TokenRouter from '@/routes/token/index.js'
import UserRouter from '@/routes/user/index.js'
import WordRouter from '@/routes/word/index.js'
import QuizRouter from '@/routes/quiz.js/index.js'

export const setRoutes = (app) => {
    app.use('/user', UserRouter)
    app.use('/token', TokenRouter)
    app.use('/words', WordRouter)
    app.use('/quiz', QuizRouter)
    app.use('/', AuthRouter)
    console.log('routes set')
}
