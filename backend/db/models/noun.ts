import { Model, DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes } from 'sequelize'
import { WordAttributes } from './word'

class Noun extends Model<InferAttributes<Noun>, InferCreationAttributes<Noun>> {
    declare wordId: string
    declare nounType: string | null
    declare gender: string | null
    declare brokenPlural: string | null

    // Association methods
    declare getWord: BelongsToGetAssociationMixin<Model<WordAttributes>>

    static associate(models: any) {
        Noun.belongsTo(models.words, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
    }
}

export default (sequelize: any): typeof Noun => {
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

export type NounModel = typeof Noun
export type NounInstance = Noun
export type NounAttributes = InferAttributes<Noun>
export type NounCreationAttributes = InferCreationAttributes<Noun>
