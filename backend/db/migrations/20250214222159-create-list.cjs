'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('lists', {
            listId: {
                primaryKey: true,
                allowNull: false,
                type: Sequelize.STRING,
            },
            listName: {
                type: Sequelize.STRING,
            },
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
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        })
        await queryInterface.createTable('listitems', {
            listId: {
                allowNull: false,
                references: {
                    model: {
                        tableName: 'lists',
                    },
                    key: 'listId',
                },
                type: Sequelize.STRING,
            },
            order: {
                type: Sequelize.INTEGER,
            },
            isComplete: {
                type: Sequelize.BOOLEAN,
            },
            header: {
                type: Sequelize.STRING,
            },
            content: {
                type: Sequelize.STRING,
            },
            dueDate: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable('lists')
        await queryInterface.dropTable('listitems')
    },
}
