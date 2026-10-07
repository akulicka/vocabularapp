import { Model, DataTypes, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { UserAttributes } from './user.js'
import { AnswerAttributes } from './answer.js'

class Quiz extends Model<InferAttributes<Quiz>, InferCreationAttributes<Quiz>> {
    declare quizId: string
    declare userId: string
    declare selectedTags: string[] | null
    declare wordIds: string[]
    declare endsAt: Date
    declare completedAt: Date | null
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    declare getUser: BelongsToGetAssociationMixin<Model<UserAttributes>>
    declare getAnswers: HasManyGetAssociationsMixin<Model<AnswerAttributes>>

    static associate(models: any) {
        Quiz.belongsTo(models.users, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
        Quiz.hasMany(models.answers, {
            foreignKey: {
                name: 'quizId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof Quiz => {
    Quiz.init(
        {
            quizId: {
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
            wordIds: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            endsAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            completedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
        {
            sequelize,
            modelName: 'quizzes',
        },
    )

    return Quiz
}

export type QuizModel = typeof Quiz
export type QuizInstance = Quiz
export type QuizAttributes = InferAttributes<Quiz>
export type QuizCreationAttributes = InferCreationAttributes<Quiz>
