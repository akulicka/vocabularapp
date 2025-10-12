import { Model, DataTypes, Optional } from 'sequelize'

interface NounAttributes {
    wordId: string
    nounType?: string
    gender?: string
    brokenPlural?: string
}

interface NounCreationAttributes extends Optional<NounAttributes, 'nounType' | 'gender' | 'brokenPlural'> {}

class Noun extends Model<NounAttributes, NounCreationAttributes> {
    static associate(models: any) {
        Noun.belongsTo(models.words, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any) => {
    Noun.init(
        {
            wordId: {
                primaryKey: true,
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.Word,
                    key: 'wordId',
                },
            },
            nounType: DataTypes.STRING,
            gender: DataTypes.STRING,
            brokenPlural: DataTypes.STRING,
        },
        {
            sequelize,
            timestamps: false,
            modelName: 'nouns',
        },
    )

    return Noun
}
