var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');
var keyController = require('./keyController.js');

var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey) => {
  let buff = new Buffer(fileContents);
  let base64data = buff.toString('base64');
  if(!keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer(publicKey, 'hex'))){
    console.log('Message not verified!  Not adding to mempool.');
    return '';
  }

  var memPool = new MemPool({
    fileName: fileName,
    fileContents: base64data,
    signedMessage: signedMessage.Signature.toString('hex'),
    dateAdded: new Date(),
    publicKey: publicKey
  });
  memPool.save();
  return base64data;
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
