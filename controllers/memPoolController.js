var { MongoClient } = require('mongodb');
var keyController = require('./keyController.js');
var crypto = require('crypto');
var hashUtil = require('../utilities/hash.js');
var memPoolRepository = require('../repositories/mempoolRepository.js');

//Adds a file to the mempool.
var AddCodeFileToMemPool = (async (fileName, fileContents, signedMessage, publicKey) => {
  let buff = new Buffer.from(fileContents);
  let base64data = buff.toString('base64');
  var verified = await keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer.from(publicKey, 'hex'));
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var result = await memPoolRepository.AddMemPoolItem(fileName, base64data, signedMessage, publicKey)
  return result;
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

module.exports = {
  AddCodeFileToMemPool,
  ValidateMemPoolItems
}
