import { Model, DataTypes, Optional } from 'sequelize'

interface TokenAttributes {
    tokenId: string
    userId?: string
    createdAt?: Date
    updatedAt?: Date
    tokenClass?: string
    payload?: any
}

interface TokenCreationAttributes extends Optional<TokenAttributes, 'userId' | 'createdAt' | 'updatedAt' | 'tokenClass' | 'payload'> {}

class Token extends Model<TokenAttributes, TokenCreationAttributes> {
    static associate(models: any) {
        // models.List.belongsTo(User)
        // User.hasMany(models.List)
    }
}

export default (sequelize: any) => {
    Token.init(
        {
            userId: {
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.User,
                    key: 'userId',
                },
            },
            tokenId: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
            tokenClass: DataTypes.STRING,
            payload: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'tokens',
        },
    )

    return Token
}
