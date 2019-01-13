var { MongoClient } = require('mongodb');
var mongo = require('mongoskin');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;
var filetypes = require('../enums/mempoolFiletypes.js');
var { MemPool } = require('../models/mempool.js');
var hashUtil = require('../utilities/hash.js');

mongoose.GetDb().then((db) => {
  db.collection("mempools").createIndex({ "hash": 1 }, { unique: true });
  db.collection("mempools").createIndex({ "deleted": 1 }, { unique: false });
});

var AddMemPoolItem = ((fileName, base64FileContents, signedMessage, publicKey, salt, dateAdded, hash) => {
  var promise = new Promise((resolve, reject) => {
    var memPool = new MemPool({
      type: filetypes.File,
      fileData: {
        fileName: fileName,
        fileContents: base64FileContents
      },
      signedMessage: signedMessage,
      dateAdded: dateAdded,
      publicKey: publicKey,
      hash: hash,
      deleted: false,
      salt: salt
    });
    memPool.save();
    resolve(memPool);
  });
  return promise;
});


//Gets all mempool items.
var GetMemPoolItems = (() => {
  var promise = new Promise((resolve, reject) => {
    mongoose.GetDb()
      .then((db) => {
        resolve(db.collection('mempools').find({ deleted: false }).sort({ dateAdded: 1 }).toArray());
      }, (err) => {
        reject(err);
      });
  });
  return promise;
});

//Deletes by _id all memPoolItems in the list
var DeleteMemPoolItems = ((memPoolItems) => {
  var promise = new Promise((resolve, reject) => {
    mongoose.GetDb()
      .then((db) => {
        for (i = 0; i < memPoolItems.length; i++) {
          db.collection('mempools').deleteOne({ hash: memPoolItems[i].hash });
        }
        resolve(true);
      }, (err) => {
        reject(err);
      });
  });
  return promise;
});

var GetMemPoolItem = (async (hash) => {
  var db = await mongoose.GetDb();
  return db.collection('mempools').find({ hash: hash }).toArray();
});

module.exports = {
  DeleteMemPoolItems,
  GetMemPoolItems,
  AddMemPoolItem,
  GetMemPoolItem
}
