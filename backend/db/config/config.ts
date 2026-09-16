import { createRequire } from 'node:module'

type DbEnvConfig = {
    username?: string
    password?: string
    database?: string
    host?: string
    port: number
    dialect: 'mysql'
}

const require = createRequire(import.meta.url)
const config: Record<'development' | 'test' | 'production', DbEnvConfig> = require('./config.cjs')

export default config
