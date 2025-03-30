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
            // List.belongsTo(models.User)
            // List.hasMany(models.ListItem)
            // models.ListItem.belongsTo(List)
            // models.User.hasMany(List)
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