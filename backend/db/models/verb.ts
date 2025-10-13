import { Model, DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes } from 'sequelize'
import { WordAttributes } from './word'

class Verb extends Model<InferAttributes<Verb>, InferCreationAttributes<Verb>> {
    declare wordId: string
    declare verbForm: string | null
    declare irregularityClass: string | null
    declare tense: string | null

    // Association methods
    declare getWord: BelongsToGetAssociationMixin<Model<WordAttributes>>

    static associate(models: any) {
        Verb.belongsTo(models.words, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof Verb => {
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

export type VerbModel = typeof Verb
export type VerbAttributes = InferAttributes<Verb>
export type VerbCreationAttributes = InferCreationAttributes<Verb>
