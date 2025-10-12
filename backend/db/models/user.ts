import { Model, DataTypes, Optional } from 'sequelize'

interface UserAttributes {
    userId: string
    username?: string
    email?: string
    password?: string
    profile_image?: string
    verified?: boolean
    createdAt?: Date
    updatedAt?: Date
}

interface UserCreationAttributes extends Optional<UserAttributes, 'username' | 'email' | 'password' | 'profile_image' | 'verified' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
    static associate(models: any) {
        // models.List.belongsTo(User)
        // User.hasMany(models.List)
    }
}

export default (sequelize: any) => {
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
