import { Model, DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { UserAttributes } from './user'

class Token extends Model<InferAttributes<Token>, InferCreationAttributes<Token>> {
    declare tokenId: string
    declare userId: string
    declare tokenClass: string
    declare payload: any | null
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>

    // Association methods
    declare getUser: BelongsToGetAssociationMixin<Model<UserAttributes>>

    static associate(models: any) {
        Token.belongsTo(models.users, {
            foreignKey: {
                name: 'userId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof Token => {
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

export type TokenModel = typeof Token
export type TokenAttributes = InferAttributes<Token>
export type TokenCreationAttributes = InferCreationAttributes<Token>
