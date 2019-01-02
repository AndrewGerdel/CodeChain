var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');
var keyController = require('./keyController.js');

var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey) => {
  var promise = new Promise((resolve, reject) => {
    debugger;
    let buff = new Buffer(fileContents);
    let base64data = buff.toString('base64');
    if(!keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer(publicKey, 'hex'))){
      reject('Message not verified!  Not adding to mempool.');
    }
    var memPool = new MemPool({
      fileName: fileName,
      fileContents: base64data,
      signedMessage: signedMessage.Signature.toString('hex'),
      dateAdded: new Date(),
      publicKey: publicKey
    });
    memPool.save();
    resolve(base64data);
  });
  return promise;
});


var GetMemPoolItems = (() => {
  var promise = new Promise((resolve, reject) => {
    var url = 'mongodb://localhost/CodeChain';
    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
      if(error){
        console.log('Unable to connect to Mongo');
        return;
      }
      var db = client.db('CodeChain');
      resolve(db.collection('mempools').find().sort({dateAdded: 1}).toArray());
    });
  });
  return promise;
});

var DeleteMemPoolItems = ((memPoolItems) => {
  var promise = new Promise((resolve, reject) => {
    var url = 'mongodb://localhost/CodeChain';
    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
      if(error){
        console.log('Unable to connect to Mongo');
        return;
      }
      var db = client.db('CodeChain');
      for(i=0;i<memPoolItems.length;i++){
        db.collection('mempools').deleteOne({_id : memPoolItems[i]._id});
      }
      resolve(true);
    });
  });
  return promise;
});

module.exports = {
   AddCodeFileToMemPool:AddCodeFileToMemPool,
   GetMemPoolItems,
   DeleteMemPoolItems
}
