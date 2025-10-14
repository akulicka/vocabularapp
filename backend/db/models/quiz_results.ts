import { Model, DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { UserAttributes } from './user'

export class QuizResult extends Model<InferAttributes<QuizResult>, InferCreationAttributes<QuizResult>> {
    declare resultId: string
    declare userId: string
    declare selectedTags: any | null
    declare totalQuestions: number
    declare correctAnswers: number
    declare completedAt: Date
    declare wordResults: any | null
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    // Association methods
    declare getUser: BelongsToGetAssociationMixin<Model<UserAttributes>>

    static associate(models: any) {
        QuizResult.belongsTo(models.users, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof QuizResult => {
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
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
        {
            sequelize,
            modelName: 'quizResults',
        },
    )

    return QuizResult
}

export type QuizResultModel = typeof QuizResult
export type QuizResultInstance = QuizResult
export type QuizResultAttributes = InferAttributes<QuizResult>
export type QuizResultCreationAttributes = InferCreationAttributes<QuizResult>
