'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class List extends Model {
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
  List.init({
      listId: {
          type: DataTypes.STRING,
          primaryKey: true
      },
      userId: {
          type: DataTypes.STRING,
          references: {
            model: sequelize.models.User,
            key: 'userId'
          }
      },
      listName: DataTypes.STRING,
    }, 
    {
      sequelize,
      modelName: 'lists',
  });
  return List;
};