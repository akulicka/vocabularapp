'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'verified', { type: Sequelize.BOOLEAN, defaultValue: 0 })
        await queryInterface.createTable('tokens', {
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: {
                        tableName: 'users',
                    },
                    key: 'userId',
                },
            },
            tokenId: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            tokenClass: {
                type: Sequelize.STRING,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'verified')
        await queryInterface.dropTable('tokens')
    },
}
