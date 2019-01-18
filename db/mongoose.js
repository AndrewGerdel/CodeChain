var { MongoClient } = require('mongodb');
var mongoose = require('mongoose');
var connectionString = require('../config.json').database;

mongoose.Promise = global.Promise;

mongoose.connect(connectionString.host + connectionString.database, { useNewUrlParser: true }, (error, client) => {
  if (error) {
    console.log('Unable to connect to Mongo');
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
          console.log('Unable to connect to Mongo');
          return;
        }
        DB = client.db(connectionString.database);
        var end = new Date();
        console.log(`${end-start}ms to open connection`);
        resolve(DB);
      });
    }
  });
  return promise;
});

module.exports = { mongoose, GetDb };
