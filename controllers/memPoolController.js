var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');
var keyController = require('./keyController.js');
var crypto = require('crypto');
var mongoose = require('../db/mongoose.js');

//Adds a file to the mempool.
var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey) => {
  var promise = new Promise((resolve, reject) => {
    let buff = new Buffer(fileContents);
    let base64data = buff.toString('base64');
    if(!keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer(publicKey, 'hex'))){
      reject('Message not verified!  Not adding to mempool.');
    }
    var dateNow = new Date();
    var memPool = new MemPool({
      fileName: fileName,
      fileContents: base64data,
      signedMessage: signedMessage.Signature.toString('hex'),
      dateAdded: dateNow,
      publicKey: publicKey,
      hash: digest(fileName + fileContents + signedMessage + dateNow).toString("hex")
    });
    memPool.save();
    resolve(memPool);
  });
  return promise;
});

//creates a sha256 hash
function digest(str, algo = "sha256") {
  return crypto.createHash(algo).update(str).digest();
}

module.exports = {
   AddCodeFileToMemPool,
}
