'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TagWord extends Model {
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
  TagWord.init(
    {
      wordId:{
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING,
        references: {
            model: sequelize.models.Word,
            key: 'wordId'
        }
      },
      tagId: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING,
        references: {
            model: sequelize.models.Tag,
            key: 'tagId'
        }
      },
    }, 
    {
      sequelize,
      timestamps: false,
      modelName: 'tagwords',
  });
  return TagWord;
};
