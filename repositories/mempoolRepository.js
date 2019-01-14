var mongoose = require('../db/mongoose.js');
var filetypes = require('../enums/mempoolFiletypes.js');
var { MemPool } = require('../models/mempool.js');
var hashUtil = require('../utilities/hash.js');
var crypto = require('crypto');

mongoose.GetDb().then((db) => {
  db.collection("mempools").createIndex({ "hash": 1 }, { unique: true });
  db.collection("mempools").createIndex({ "deleted": 1 }, { unique: false });
});

var AddMemPoolItem = ((fileName, base64FileContents, signedMessage, publicKey, salt, dateAdded, hash) => {
  var promise = new Promise(async(resolve, reject) => {
    var publicKeyHash = await hashUtil.CreateSha256Hash(publicKey);
    var memPool = new MemPool({
      type: filetypes.File,
      fileData: {
        fileName: fileName,
        fileContents: base64FileContents
      },
      signedMessage: signedMessage,
      dateAdded: dateAdded,
      publicKey: publicKey,
      publicKeyHash: publicKeyHash.toString('hex'),
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

//Note: This DOES NOT SAVE the item to the database.  MiningRewards are not ever saved to the mempools collection. They
//are only included in the block data.
var CreateMiningRewardMemPoolItem = (async (dateAdded, publicKey, blockReward) => {
  var salt = crypto.randomBytes(16);
  var memPoolItemHash = await hashUtil.CreateSha256Hash(`${publicKey}${dateAdded}${salt.toString('hex')}`);
  var memPool = new MemPool({
    type: filetypes.MiningReward,
    dateAdded: dateAdded,
    publicKeyHash: publicKey,
    hash: memPoolItemHash.toString('hex'), 
    blockReward: blockReward
  });
  return memPool;
});

module.exports = {
  DeleteMemPoolItems,
  GetMemPoolItems,
  AddMemPoolItem,
  GetMemPoolItem,
  CreateMiningRewardMemPoolItem
}
