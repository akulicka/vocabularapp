'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class QuizResult extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            QuizResult.belongsTo(models.users, {
                foreignKey: {
                    name: 'userId',
                    allowNull: false,
                },
            })
        }
    }
    QuizResult.init(
        {
            resultId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'userId',
                },
            },
            selectedTags: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            totalQuestions: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            correctAnswers: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            completedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            wordResults: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'quizResults',
        },
    )
    return QuizResult
}
