'use strict'

const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000'
const ADMIN_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$ZZB1Zc5cOUUg/4n9HHZ43A$6vtOYndwmEklXxRGwSBr+VfmbJS+AV63oAs6E+kdsoU'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'isAdmin', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        })
        await queryInterface.bulkUpdate(
            'users',
            {
                isAdmin: true,
                verified: true,
                password: ADMIN_PASSWORD_HASH,
            },
            { userId: ADMIN_USER_ID },
        )
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'isAdmin')
    },
}
