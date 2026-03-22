export default {
    development: {
        username: process.env.DB_USER || 'db_app',
        password: process.env.DB_PASSWORD || '&yn<X9Mb5hHZb)F5/&(]',
        database: process.env.DB_NAME || 'vocabular',
        host: process.env.DB_HOST || 'db',
        port: Number(process.env.DB_PORT || 3306),
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

// export default {
//     development: {
//         username: 'db_app',
//         password: '&yn<X9Mb5hHZb)F5/&(]',
//         database: 'vocabular',
//         host: '172.27.128.1',
//         dialect: 'mysql',
//     },
//     test: {
//         username: 'root',
//         password: process.env.MYSQL_ROOT_PASSWORD,
//         database: process.env.MYSQL_DATABASE,
//         host: '172.28.0.1',
//         dialect: 'mysql',
//     },
//     production: {
//         username: 'root',
//         password: process.env.MYSQL_ROOT_PASSWORD,
//         database: process.env.MYSQL_DATABASE,
//         host: '172.28.0.1',
//         dialect: 'mysql',
//     },
// }
