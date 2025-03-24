import express from "express";
import cors from "cors";
import bodyParser from 'body-parser'
import fs from 'fs';
import https from 'https';
import cookieParser from 'cookie-parser'
import {setRoutes} from './routes/index.js'

const options = {
  cert: fs.readFileSync(process.env.NODE_ENV == 'development' ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_CERT}` : process.env.PATH_TO_CERT, 'utf8'),
  key: fs.readFileSync(process.env.NODE_ENV == 'development' ? `${process.env.LOCAL_CERT_DIR}/${process.env.PATH_TO_KEY}` : process.env.PATH_TO_KEY, 'utf8')
}

const app = express();
const port = "3000";

app.use(cors({      
  origin: process.env.NODE_ENV == 'development' ? "https://localhost:5173" : process.env.HOST_DOMAIN,
  credentials: true,}))
app.use(cookieParser())
app.use(bodyParser.json())
setRoutes(app)

https.createServer(options, app).listen(port, () => console.log(`live on ${port} in ${process.env.NODE_ENV}`))