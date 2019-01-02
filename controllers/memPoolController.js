var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');

var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey, privateKey) => {
  let buff = new Buffer(fileContents);
  let base64data = buff.toString('base64');

  var memPool = new MemPool({
    fileName: fileName,
    fileContents: base64data,
    signedMessage: signedMessage.toString('hex'),
    dateAdded: new Date(),
    publicKey: publicKey,
    privateKey: privateKey
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

module.exports = {
   AddCodeFileToMemPool:AddCodeFileToMemPool,
   GetMemPoolItems
}
