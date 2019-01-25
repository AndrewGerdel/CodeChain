var { MongoClient } = require('mongodb');
var mongoose = require('mongoose');
var connectionString = require('../config.json').database;
var logger = require('../loggers/databaseLog');

mongoose.Promise = global.Promise;

mongoose.connect(connectionString.host + connectionString.database, { useNewUrlParser: true }, (error, client) => {
  if (error) {
    logger.WriteLog('Unable to connect to Mongo', true);
    return;
  }
});

var DB;

var GetDb = (() => {
  var promise = new Promise((resolve, reject) => {
    if (DB) {
      resolve(DB);
    } else {
      var start = new Date();
      MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
        if (error) {
          logger.WriteLog('Unable to connect to Mongo', true);
          return;
        }
        DB = client.db(connectionString.database);
        var end = new Date();
        resolve(DB);
      });
    }
  });
  return promise;
});

module.exports = { mongoose, GetDb };
