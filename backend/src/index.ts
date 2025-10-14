import express, { Application } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import fs from 'fs'
import https from 'https'
import http from 'http'

import { setRoutes } from '@/routes/index.js'

const isDev = process.env.NODE_ENV === 'development'
// SSL options for HTTPS
const sslOptions: { cert: string; key: string } = {
    cert: fs.readFileSync((isDev ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_CERT}` : process.env.PATH_TO_CERT)!, 'utf8'),
    key: fs.readFileSync((isDev ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_KEY}` : process.env.PATH_TO_KEY)!, 'utf8'),
}

const app: Application = express()
const port: string = '3000'

app.use(
    cors({
        origin: process.env.NODE_ENV == 'development' ? 'http://localhost:5173' : process.env.HOST_DOMAIN,
        credentials: true,
    }),
)
app.use(cookieParser())
app.use(bodyParser.json())
setRoutes(app)

// Start server based on environment
const server = isDev ? http.createServer(app) : https.createServer(sslOptions, app)

server.listen(port, () => console.log(`${isDev ? 'HTTP' : 'HTTPS'} server live on port ${port} in ${process.env.NODE_ENV}`))
