import express, { Application } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import fs from 'fs'
import https from 'https'
import http from 'http'

import { setRoutes } from '@routes'

const isDev = process.env.NODE_ENV === 'development'
const behindTlsProxy = process.env.BEHIND_TLS_PROXY === 'true'
const useHttps = !isDev && !behindTlsProxy

function loadSslOptions(): { cert: string; key: string } {
    const certPath = (isDev ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_CERT}` : process.env.PATH_TO_CERT)!
    const keyPath = (isDev ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_KEY}` : process.env.PATH_TO_KEY)!
    return {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8'),
    }
}

const app: Application = express()
app.set('trust proxy', 1)

const port: string = process.env.PORT ?? '3000'

app.use(
    cors({
        origin: process.env.NODE_ENV == 'development' ? 'http://localhost:5173' : process.env.HOST_DOMAIN,
        credentials: true,
    }),
)
app.use(cookieParser())
app.use(bodyParser.json())
setRoutes(app)

const server = useHttps ? https.createServer(loadSslOptions(), app) : http.createServer(app)

server.listen(port, () => console.log(`${useHttps ? 'HTTPS' : 'HTTP'} server live on port ${port} in ${process.env.NODE_ENV}`))
