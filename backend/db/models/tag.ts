import { Model, DataTypes, BelongsToManyGetAssociationsMixin, BelongsToManySetAssociationsMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { WordAttributes } from './word'

class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
    declare tagId: string
    declare tagName: string
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare createdBy: string | null

    // Association methods
    declare getWords: BelongsToManyGetAssociationsMixin<Model<WordAttributes>>
    declare setWords: BelongsToManySetAssociationsMixin<Model<WordAttributes>, any>
    static associate(models: any) {
        Tag.belongsToMany(models.words, {
            through: 'tagwords',
            foreignKey: 'tagId',
        })
    }
}

export default (sequelize: any): typeof Tag => {
    Tag.init(
        {
            tagId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            tagName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
            createdBy: {
                type: DataTypes.STRING,
                references: {
                    model: 'users',
                    key: 'userId',
                },
            },
        },
        {
            sequelize,
            modelName: 'tags',
        },
    )

    return Tag
}

export type TagModel = typeof Tag
export type TagAttributes = InferAttributes<Tag>
export type TagCreationAttributes = InferCreationAttributes<Tag>
