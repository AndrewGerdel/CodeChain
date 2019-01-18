var mongoose = require('../db/mongoose.js');
var filetypes = require('../enums/mempoolFiletypes.js');
var { MemPool } = require('../models/mempool.js');
var hashUtil = require('../utilities/hash.js');
var crypto = require('crypto');

mongoose.GetDb().then((db) => {
  db.collection("mempools").createIndex({ "hash": 1 }, { unique: true });
  db.collection("mempools").createIndex({ "deleted": 1 }, { unique: false });
  db.collection("mempools").createIndex({ "signedMessageHash": 1 }, { unique: true });
});

var AddCodeFileMemPoolItem = (async (fileName, base64FileContents, signedMessage, publicKey, salt, dateAdded, hash) => {
  var publicKeyHash = await hashUtil.CreateSha256Hash(publicKey);
  var signatureHash = await hashUtil.CreateSha256Hash(signedMessage);


  var memPool = new MemPool({
    type: filetypes.File,
    fileData: {
      fileName: fileName,
      fileContents: base64FileContents
    },
    signedMessage: signedMessage,
    signedMessageHash: signatureHash.toString('hex'),
    dateAdded: dateAdded,
    publicKey: publicKey,
    publicKeyHash: publicKeyHash.toString('hex'),
    hash: hash,
    deleted: false,
    salt: salt
  });
  memPool.save();
  return memPool;
});

var AddTransactionMemPoolItem = (async (from, to, amount, signedMessage, publicKey, salt, dateAdded, hash) => {
  var publicKeyHash = await hashUtil.CreateSha256Hash(publicKey);
  var signatureHash = await hashUtil.CreateSha256Hash(signedMessage);
  if (publicKeyHash.toString('hex') != from) {
    //safety check
    throw new Error(`Supplied data mismatch: From: ${from}, CalculatedHash: ${publicKeyHash.toString('hex')}`);
  }

  var memPool = new MemPool({
    type: filetypes.Transaction,
    transactionData: {
      from: from,
      to: to,
      amount: amount
    },
    signedMessage: signedMessage,
    signedMessageHash: signatureHash.toString('hex'),
    dateAdded: dateAdded,
    publicKey: publicKey,
    publicKeyHash: from,
    hash: hash,
    deleted: false,
    salt: salt
  });
  memPool.save();
  return memPool;
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
  var signedMessageHash = await hashUtil.CreateSha256Hash(memPoolItemHash.toString('hex'));  //meaningless, but required for the unique index
  // console.log('signedMessageHash is ', signedMessageHash.toString('hex'));

  var memPool = new MemPool({
    type: filetypes.MiningReward,
    dateAdded: dateAdded,
    publicKeyHash: publicKey,
    signedMessageHash: signedMessageHash.toString('hex'), //meaningless, but required for the unique index
    hash: memPoolItemHash.toString('hex'),
    blockReward: blockReward
  });
  return memPool;
});

module.exports = {
  DeleteMemPoolItems,
  GetMemPoolItems,
  AddCodeFileMemPoolItem,
  GetMemPoolItem,
  CreateMiningRewardMemPoolItem,
  AddTransactionMemPoolItem
}
