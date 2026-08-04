'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const { hashPassword } = require('../../shared/utils/hashHelper');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'role_id',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      // Applied via User.unscoped().scope('withPassword') so defaultScope
      // password exclusion is not merged back in.
      withPassword: {
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'password',
          'phone',
          'avatar',
          'status',
          'isEmailVerified',
          'lastLoginAt',
          'roleId',
          'createdBy',
          'updatedBy',
          'createdAt',
          'updatedAt',
          'deletedAt',
        ],
      },
    },
    indexes: [
      { fields: ['email'], unique: true, name: 'users_email_unique' },
      { fields: ['status'], name: 'users_status_idx' },
      { fields: ['role_id'], name: 'users_role_id_idx' },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await hashPassword(user.password);
        }
      },
    },
  },
);

User.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
