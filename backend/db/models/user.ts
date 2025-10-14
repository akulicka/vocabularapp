import { Model, DataTypes, HasManyGetAssociationsMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { TokenAttributes } from './token'
import { QuizResultAttributes } from './quiz_results'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare userId: string
    declare username: string
    declare email: string
    declare password: string
    declare profile_image: string | null
    declare verified: boolean | null

    // Association methods
    declare getTokens: HasManyGetAssociationsMixin<Model<TokenAttributes>>
    declare getQuizResults: HasManyGetAssociationsMixin<Model<QuizResultAttributes>>

    static associate(models: any) {
        User.hasMany(models.tokens, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
        User.hasMany(models.quizResults, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof User => {
    console.log('🔧 Initializing User model...')

    User.init(
        {
            username: DataTypes.STRING,
            userId: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            profile_image: DataTypes.STRING,
            verified: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: 'users',
        },
    )

    console.log('✅ User model initialized successfully')
    console.log('📊 User model attributes:', Object.keys(User.getAttributes()))

    return User
}

export type UserModel = typeof User
export type UserInstance = User
export type UserAttributes = InferAttributes<User>
export type UserCreationAttributes = InferCreationAttributes<User>
