var mongoose = require('../db/mongoose.js');
var filetypes = require('../enums/mempoolFiletypes.js');
var { MemPool } = require('../models/mempool.js');
var hashUtil = require('../utilities/hash.js');
var crypto = require('crypto');

mongoose.GetDb().then((db) => {
  db.collection("mempools").createIndex({ "hash": 1 }, { unique: true });
  db.collection("mempools").createIndex({ "signatureHash": 1 }, { unique: true });
});

var AddCodeFileMemPoolItem = (async (fileName, base64FileContents, signature, publicKey, salt, dateAdded, hash, repo, memo) => {
  
  var address = await hashUtil.CreateSha256Hash(publicKey);
  var signatureHash = await hashUtil.CreateSha256Hash(signature);

  if (repo) {
    var memPool = new MemPool({
      type: filetypes.File,
      fileData: {
        fileName: fileName,
        fileContents: base64FileContents,
        repo: {
          name: repo.Name,
          hash: repo.Hash,
          file: repo.File
        }
      },
      signature: signature,
      signatureHash: signatureHash.toString('hex'),
      dateAdded: dateAdded,
      publicKey: publicKey,
      address: address.toString('hex'),
      hash: hash,
      salt: salt,
      memo: memo
    });
    memPool.save();
    return memPool;
  } else {
    var memPool = new MemPool({
      type: filetypes.File,
      fileData: {
        fileName: fileName,
        fileContents: base64FileContents
      },
      signature: signature,
      signatureHash: signatureHash.toString('hex'),
      dateAdded: dateAdded,
      publicKey: publicKey,
      address: address.toString('hex'),
      hash: hash,
      salt: salt,
      memo: memo
    });
    memPool.save();
    return memPool;
  }

});

var AddTransactionMemPoolItem = (async (from, to, amount, signature, publicKey, salt, dateAdded, hash, memo) => {
  var address = await hashUtil.CreateSha256Hash(publicKey);
  if (address.toString('hex') != from) {
    //safety check
    throw new Error(`Supplied data mismatch: From: ${from}, CalculatedHash: ${address.toString('hex')}`);
  }
  var signatureHash = await hashUtil.CreateSha256Hash(signature);

  var memPool = new MemPool({
    type: filetypes.Transaction,
    transactionData: {
      from: from,
      to: to,
      amount: amount
    },
    signature: signature,
    signatureHash: signatureHash.toString('hex'),
    dateAdded: dateAdded,
    publicKey: publicKey,
    address: from,
    hash: hash,
    salt: salt,
    memo: memo
  });
  memPool.save();
  return memPool;
});


var AddMessageMemPoolItem = (async (from, to, encryptedMessageText, signature, publicKey, salt, dateAdded, hash, memo) => {

  
  var address = await hashUtil.CreateSha256Hash(publicKey);
  if (address.toString('hex') != from) {
    //safety check
    throw new Error(`Supplied data mismatch:: From: ${from}, CalculatedHash: ${address.toString('hex')}`);
  }
  var signatureHash = await hashUtil.CreateSha256Hash(signature);

  var memPool = new MemPool({
    type: filetypes.Message,
    messageData: {
      from: from,
      to: to,
      messageText: encryptedMessageText
    },
    signature: signature,
    signatureHash: signatureHash.toString('hex'),
    dateAdded: dateAdded,
    publicKey: publicKey,
    address: from,
    hash: hash,
    salt: salt, 
    memo: memo
  });
  memPool.save();
  return memPool;
});

//Gets all mempool items.
var GetMemPoolItems = (async() => {
  var db = await mongoose.GetDb();
  return db.collection('mempools').find({  }).sort({ dateAdded: 1 }).toArray();
});

//Deletes by hash all memPoolItems in the list
var DeleteMemPoolItems = (async (memPoolItems) => {
  var db = await mongoose.GetDb();
  for (i = 0; i < memPoolItems.length; i++) {
    db.collection('mempools').deleteOne({ hash: memPoolItems[i].hash });
  }
  return true;
});

var DeleteMemPoolItem = (async (memPoolItem) => {
  var db = await mongoose.GetDb();
  db.collection('mempools').deleteOne({ hash: memPoolItem.hash });
});


var GetMemPoolItem = (async (hash) => {
  var db = await mongoose.GetDb();
  return db.collection('mempools').find({ hash: hash }).toArray();
});

//Note: This DOES NOT SAVE the item to the database.  MiningRewards are not ever saved to the mempools collection. They
//are only included in the block data.
var CreateMiningRewardMemPoolItem = (async (dateAdded, address, blockReward) => {
  var salt = crypto.randomBytes(16);
  var memPoolItemHash = await hashUtil.CreateSha256Hash(`${address}${dateAdded}${salt.toString('hex')}`);
  var signatureHash = await hashUtil.CreateSha256Hash(memPoolItemHash.toString('hex'));  //meaningless, but required for the unique index

  var memPool = new MemPool({
    type: filetypes.MiningReward,
    dateAdded: dateAdded,
    address: address,
    signatureHash: signatureHash.toString('hex'), //meaningless, but required for the unique index
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
  AddTransactionMemPoolItem,
  DeleteMemPoolItem,
  AddMessageMemPoolItem
}
