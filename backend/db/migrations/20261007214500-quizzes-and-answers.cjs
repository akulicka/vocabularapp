'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.dropTable('quizResults')

        await queryInterface.createTable('quizzes', {
            quizId: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'userId',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            selectedTags: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            wordIds: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            endsAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            completedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        })

        await queryInterface.createTable('answers', {
            quizId: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'quizzes',
                    key: 'quizId',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            wordId: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'words',
                    key: 'wordId',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            userAnswer: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            isCorrect: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('answers')
        await queryInterface.dropTable('quizzes')

        await queryInterface.createTable('quizResults', {
            resultId: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'userId',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            selectedTags: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            totalQuestions: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            correctAnswers: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            completedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            wordResults: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        })
    },
}
