'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        // ListItem.belongsTo(models.List)
        // models.List.hasMany(ListItem)
    }
  }
  ListItem.init({
    listId: DataTypes.STRING,
    order: DataTypes.INTEGER,
    isComplete: DataTypes.BOOLEAN,
    header: DataTypes.STRING,
    content: DataTypes.STRING,
    dueDate: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'listitems',
  });
  return ListItem;
};