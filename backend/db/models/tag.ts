import { Model, DataTypes, Optional } from 'sequelize'

interface TagAttributes {
    tagId: string
    tagName: string
    createdAt?: Date
    updatedAt?: Date
    createdBy?: string
}

interface TagCreationAttributes extends Optional<TagAttributes, 'createdAt' | 'updatedAt'> {}

class Tag extends Model<TagAttributes, TagCreationAttributes> {
    static associate(models: any) {
        Tag.belongsToMany(models.words, {
            through: models.tagwords,
            foreignKey: 'tagId',
        })
    }
}

export default (sequelize: any) => {
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
