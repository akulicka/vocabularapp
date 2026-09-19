// sequelize-cli cannot load config.ts (ESM). App loads this file via config.ts.
const fromEnv = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
}

module.exports = {
    development: fromEnv,
    test: fromEnv,
    production: fromEnv,
}
