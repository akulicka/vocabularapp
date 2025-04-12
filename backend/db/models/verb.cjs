'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Verb extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Verb.belongsTo(models.words, 
                {foreignKey: {
                    name: 'wordId',
                    allowNull: false
                  }},)
        }
    }
    Verb.init({
        wordId:{
            primaryKey: true,
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.Word,
                key: 'wordId'
            }
        },
        verbForm: DataTypes.STRING,
        irregularityClass: DataTypes.STRING,
        tense: DataTypes.STRING,
    },
    {
        sequelize,
        timestamps: false,
        modelName: 'verbs',
    });
    return Verb;
};