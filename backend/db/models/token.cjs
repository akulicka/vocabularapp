'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class Token extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // models.List.belongsTo(User)
            // User.hasMany(models.List)
        }
    }
    Token.init(
        {
            userId: {
                type: DataTypes.STRING,
                references: {
                    model: sequelize.models.User,
                    key: 'userId',
                },
            },
            tokenId: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
            tokenClass: DataTypes.STRING,
            payload: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'tokens',
        },
    )
    return Token
}
