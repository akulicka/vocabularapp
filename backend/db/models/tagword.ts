import { Model, DataTypes } from 'sequelize'

interface TagWordAttributes {
    wordId: string
    tagId: string
}

class TagWord extends Model<TagWordAttributes> {
    static associate() {
        // List.belongsTo(models.User)
        // List.hasMany(models.ListItem)
        // models.ListItem.belongsTo(List)
        // models.User.hasMany(List)
    }
}

export default (sequelize: any) => {
    TagWord.init(
        {
            wordId: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.Word,
                    key: 'wordId',
                },
            },
            tagId: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.Tag,
                    key: 'tagId',
                },
            },
        },
        {
            sequelize,
            timestamps: false,
            modelName: 'tagwords',
        },
    )

    return TagWord
}
