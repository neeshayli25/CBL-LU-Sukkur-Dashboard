'use strict';

const path = require('path');
const config = require('./index');

const isSqlite = config.db.dialect === 'sqlite';

const sqliteStorage = config.db.storage
  || path.join(__dirname, '..', '..', '..', 'data', 'cbl.sqlite');

const sharedDefine = {
  underscored: true,
  timestamps: true,
  paranoid: true,
};

const mysqlBase = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  define: sharedDefine,
};

const sqliteBase = {
  dialect: 'sqlite',
  storage: sqliteStorage,
  logging: config.env === 'development' ? console.log : false,
  define: sharedDefine,
};

module.exports = {
  development: isSqlite
    ? { ...sqliteBase, logging: config.env === 'development' ? console.log : false }
    : {
      ...mysqlBase,
      logging: config.env === 'development' ? console.log : false,
      pool: {
        min: config.db.poolMin,
        max: config.db.poolMax,
        acquire: 30000,
        idle: 10000,
      },
    },
  test: isSqlite
    ? {
      ...sqliteBase,
      storage: sqliteStorage.replace(/\.sqlite$/, '.test.sqlite'),
      logging: false,
    }
    : {
      ...mysqlBase,
      database: `${config.db.name}_test`,
      logging: false,
      pool: { min: 1, max: 5 },
    },
  production: isSqlite
    ? { ...sqliteBase, logging: false }
    : {
      ...mysqlBase,
      logging: false,
      pool: {
        min: config.db.poolMin,
        max: config.db.poolMax,
        acquire: 60000,
        idle: 20000,
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    },
};
