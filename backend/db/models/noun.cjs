'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class Noun extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Noun.belongsTo(models.words, {
                foreignKey: {
                    name: 'wordId',
                    allowNull: false,
                },
            })
        }
    }
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
