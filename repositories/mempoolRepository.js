var { MongoClient } = require('mongodb');
var mongo = require('mongoskin');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;
var filetypes = require('../enums/mempoolFiletypes.js');
var { MemPool } = require('../models/mempool.js');
var hashUtil = require('../utilities/hash.js');


var AddMemPoolItem = ((fileName, base64FileContents, signedMessage, publicKey) => {
  var promise = new Promise((resolve, reject) => {
    var dateNow = new Date();
    var memPool = new MemPool({
      type: filetypes.File,
      fileData: {
        fileName: fileName,
        fileContents: base64FileContents
      },
      signedMessage: signedMessage.Signature.toString('hex'),
      dateAdded: dateNow,
      publicKey: publicKey,
      hash: hashUtil.CreateSha256Hash(fileName + base64FileContents + signedMessage + dateNow).toString("hex")
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
        resolve(db.collection('mempools').find().sort({ dateAdded: 1 }).toArray());
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
        db.collection('mempools').deleteOne({ _id: memPoolItems[i]._id });
      }
      resolve(true);
    }, (err) => {
      reject(err);
    });
  });
  return promise;
});

module.exports = {
  DeleteMemPoolItems,
  GetMemPoolItems,
  AddMemPoolItem
}
