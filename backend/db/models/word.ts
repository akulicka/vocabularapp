import { Model, DataTypes, Optional } from 'sequelize'

interface WordAttributes {
    wordId: string
    english: string
    arabic: string
    root?: string
    partOfSpeech?: string
    img?: string
    createdAt?: Date
    updatedAt?: Date
    createdBy?: string
}

interface WordCreationAttributes extends Optional<WordAttributes, 'wordId' | 'createdAt' | 'updatedAt'> {}

class Word extends Model<WordAttributes, WordCreationAttributes> {
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
            through: models.tagwords,
            foreignKey: 'wordId',
        })
    }
}

export default (sequelize: any) => {
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
