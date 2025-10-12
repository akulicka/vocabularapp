export default {
    development: {
        username: 'db_app',
        password: '&yn<X9Mb5hHZb)F5/&(]',
        database: 'vocabular',
        host: '172.27.128.1',
        dialect: 'mysql',
    },
    test: {
        username: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        host: '172.28.0.1',
        dialect: 'mysql',
    },
    production: {
        username: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        host: '172.28.0.1',
        dialect: 'mysql',
    },
}
