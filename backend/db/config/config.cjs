// sequelize-cli cannot load config.ts (ESM). App loads this file via config.ts.
function fromEnv(hostFallback, portFallback = 3306) {
    return {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DEV_DB_HOST || process.env.DB_HOST || hostFallback,
        port: Number(process.env.DEV_DB_PORT || process.env.DB_PORT || portFallback),
        dialect: 'mysql',
    }
}

module.exports = {
    development: fromEnv('localhost'),
    test: fromEnv('db'),
    production: fromEnv(undefined),
}
