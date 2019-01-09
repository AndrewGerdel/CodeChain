var { MemPool } = require('../models/mempool.js');
var { MongoClient } = require('mongodb');
var keyController = require('./keyController.js');
var crypto = require('crypto');
var mongoose = require('../db/mongoose.js');
var filetypes = require('../enums/mempoolFiletypes.js');
var hashUtil = require('../utilities/hash.js');

//Adds a file to the mempool.
var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey) => {
  var promise = new Promise((resolve, reject) => {
    let buff = new Buffer.from(fileContents);
    let base64data = buff.toString('base64');
    keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer.from(publicKey, 'hex'))
      .then((success) => {
        var dateNow = new Date();
        var memPool = new MemPool({
          type: filetypes.File,
          fileData: {
            fileName: fileName,
            fileContents: base64data
          },
          signedMessage: signedMessage.Signature.toString('hex'),
          dateAdded: dateNow,
          publicKey: publicKey,
          hash: digest(fileName + fileContents + signedMessage + dateNow).toString("hex")
        });
        memPool.save();
        resolve(memPool);
      }, (err) => {
        reject('Message not verified.  Not adding to mempool.');
      });

  });
  return promise;
});

var ValidateMemPoolItems = ((memPoolItems) => {
  var promise = new Promise((resolve, reject) => {
    for (i = 0; i < memPoolItems; i++) {
      var verified = hashUtil.VerifySignedMessage(memPoolItems[i].fileData.fileContents, memPoolItems[i].signedMessage, memPoolItems[i].publicKey);
      if (!verified) {
        reject(`Failed to verify ${memPoolItems.fileData.hash}`);
      }
    }
    resolve(true);
  });
  return promise;
});

//creates a sha256 hash
function digest(str, algo = "sha256") {
  return crypto.createHash(algo).update(str).digest();
}

module.exports = {
  AddCodeFileToMemPool,
  ValidateMemPoolItems
}
