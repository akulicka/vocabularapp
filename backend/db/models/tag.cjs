'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
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
  Tag.init({
        tagId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        tagName: { 
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        createdBy: {
            type: DataTypes.STRING,
            references: {
                model: sequelize.models.User,
                key: 'userId'
            }
        },
    }, 
    {
      sequelize,
      modelName: 'tags',
  });
  return Tag;
};
