import { Model, DataTypes, Optional } from 'sequelize'

interface VerbAttributes {
    wordId: string
    verbForm?: string
    irregularityClass?: string
    tense?: string
}

interface VerbCreationAttributes extends Optional<VerbAttributes, 'verbForm' | 'irregularityClass' | 'tense'> {}

class Verb extends Model<VerbAttributes, VerbCreationAttributes> {
    static associate(models: any) {
        Verb.belongsTo(models.words, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any) => {
    Verb.init(
        {
            wordId: {
                primaryKey: true,
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.Word,
                    key: 'wordId',
                },
            },
            verbForm: DataTypes.STRING,
            irregularityClass: DataTypes.STRING,
            tense: DataTypes.STRING,
        },
        {
            sequelize,
            timestamps: false,
            modelName: 'verbs',
        },
    )

    return Verb
}
