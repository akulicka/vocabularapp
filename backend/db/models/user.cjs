'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
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
    User.init(
        {
            username: DataTypes.STRING,
            userId: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            profile_image: DataTypes.STRING,
            verified: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: 'users',
        },
    )
    return User
}
