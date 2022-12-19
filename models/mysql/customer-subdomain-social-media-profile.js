'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerSubdomainSocialMediaProfile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };

  CustomerSubdomainSocialMediaProfile.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    subdomain_id: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    social_media_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    profile_id: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      allowNull: false,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'CustomerSubdomainSocialMediaProfile',
    tableName: 'customer_subdomain_social_media_profiles',
    timestamps: false,
    underscored: true,
  });

  return CustomerSubdomainSocialMediaProfile;
};
