// sequelize-cli cannot load config.ts (ESM). App loads this file via config.ts.
// TODO - standardize dev/test user/pass/name to remove hardcoded values.
module.exports = {
    development: {
        username: process.env.DB_USER || 'db_app',
        password: process.env.DB_PASSWORD || '&yn<X9Mb5hHZb)F5/&(]',
        database: process.env.DB_NAME || 'database_development',
        host: process.env.DEV_DB_HOST || 'localhost',
        port: Number(process.env.DEV_DB_PORT || 3306),
        dialect: 'mysql',
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || 'db',
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
    },
}
