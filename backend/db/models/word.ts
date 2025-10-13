import { Model, DataTypes, HasOneGetAssociationMixin, HasOneCreateAssociationMixin, BelongsToManyGetAssociationsMixin, BelongsToManySetAssociationsMixin, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize'
import { NounAttributes } from './noun'
import { VerbAttributes } from './verb'
import { TagAttributes } from './tag'

class Word extends Model<InferAttributes<Word>, InferCreationAttributes<Word>> {
    declare wordId: string
    declare english: string
    declare arabic: string
    declare root: string | null
    declare partOfSpeech: string | null
    declare img: string | null
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare createdBy: string | null

    // Association methods
    declare getNoun: HasOneGetAssociationMixin<Model<NounAttributes>>
    declare createNoun: HasOneCreateAssociationMixin<Model<NounAttributes>>
    declare getVerb: HasOneGetAssociationMixin<Model<VerbAttributes>>
    declare createVerb: HasOneCreateAssociationMixin<Model<VerbAttributes>>
    declare getTags: BelongsToManyGetAssociationsMixin<Model<TagAttributes>>
    declare setTags: BelongsToManySetAssociationsMixin<Model<TagAttributes>, any>

    static associate(models: any) {
        Word.hasOne(models.nouns, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
        Word.hasOne(models.verbs, {
            foreignKey: {
                name: 'wordId',
                allowNull: false,
            },
        })
        Word.belongsToMany(models.tags, {
            through: 'tagwords',
            foreignKey: 'wordId',
        })
    }
}

export default (sequelize: any): typeof Word => {
    Word.init(
        {
            wordId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            english: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            arabic: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            root: DataTypes.STRING,
            partOfSpeech: DataTypes.STRING,
            img: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
            createdBy: {
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.User,
                    key: 'userId',
                },
            },
        },
        {
            sequelize,
            modelName: 'words',
        },
    )

    return Word
}

export type WordModel = typeof Word
export type WordAttributes = InferAttributes<Word>
export type WordCreationAttributes = InferCreationAttributes<Word>
