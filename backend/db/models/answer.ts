import { Model, DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes } from 'sequelize'
import { QuizAttributes } from './quiz.js'
import { WordAttributes } from './word.js'

class Answer extends Model<InferAttributes<Answer>, InferCreationAttributes<Answer>> {
    declare quizId: string
    declare wordId: string
    declare userAnswer: string
    declare isCorrect: boolean

    declare getQuiz: BelongsToGetAssociationMixin<Model<QuizAttributes>>
    declare getWord: BelongsToGetAssociationMixin<Model<WordAttributes>>

    static associate(models: any) {
        Answer.belongsTo(models.quizzes, {
            foreignKey: {
                name: 'quizId',
                allowNull: false,
            },
        })
        Answer.belongsTo(models.words, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof Answer => {
    Answer.init(
        {
            quizId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'quizzes',
                    key: 'quizId',
                },
            },
            wordId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'words',
                    key: 'wordId',
                },
            },
            userAnswer: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isCorrect: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            sequelize,
            timestamps: false,
            modelName: 'answers',
        },
    )

    return Answer
}

export type AnswerModel = typeof Answer
export type AnswerInstance = Answer
export type AnswerAttributes = InferAttributes<Answer>
export type AnswerCreationAttributes = InferCreationAttributes<Answer>
