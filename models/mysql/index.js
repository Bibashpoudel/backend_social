const { Sequelize, DataTypes } = require('sequelize');
const { dbMysqlDatabase, dbMysqlHost, dbMysqlPassword, dbMysqlUsername, dbMysqlDialect, dbMysqlPort} = require('../../config')
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const models = {}

const connectMysqlDb = async () => {
    // Option 2: Passing parameters separately (other dialects)
    const sequelize = new Sequelize(dbMysqlDatabase, dbMysqlUsername, dbMysqlPassword, {
        host: dbMysqlHost,
        dialect: dbMysqlDialect,/* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
        port: dbMysqlPort
    });

    try {
        await sequelize.authenticate();
        console.log('Connection to mysql db has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the mysql db:', error);
    }

    fs
    .readdirSync(__dirname)
    .filter((file) => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(sequelize, DataTypes);
      models[model.name] = model;
    });

    Object.keys(models).forEach((modelName) => {
        if (models[modelName].associate) {
            models[modelName].associate(models);
        }
    });

    models.sequelize = sequelize;
    models.DataTypes = DataTypes;

    return sequelize
}


module.exports.connectMysqlDb = connectMysqlDb;

module.exports.default = models



