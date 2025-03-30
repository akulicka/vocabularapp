import AuthRouter from './auth/index.js'
import ListRouter from './lists/index.js'
import TokenRouter from './token/index.js'
import UserRouter from './user/index.js'
import WordRouter from './word/index.js'

export const setRoutes = (app) => {
    app.use('/user', UserRouter)
    app.use('/token', TokenRouter)
    app.use('/lists', ListRouter)
    app.use('/words', WordRouter)
    app.use('/', AuthRouter)
    console.log('routes set')
} 

