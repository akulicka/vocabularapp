import { Model, DataTypes, Optional } from 'sequelize'

interface QuizResultAttributes {
    resultId: string
    userId: string
    selectedTags?: any
    totalQuestions: number
    correctAnswers: number
    completedAt: Date
    wordResults?: any
    createdAt?: Date
    updatedAt?: Date
}

interface QuizResultCreationAttributes extends Optional<QuizResultAttributes, 'selectedTags' | 'wordResults' | 'createdAt' | 'updatedAt'> {}

class QuizResult extends Model<QuizResultAttributes, QuizResultCreationAttributes> {
    static associate(models: any) {
        QuizResult.belongsTo(models.users, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any) => {
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
