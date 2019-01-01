 var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');

var AddCodeFileToMemPool = ((fileContents, signedMessage, publicKey, privateKey) => {
  let buff = new Buffer(fileContents);
  let base64data = buff.toString('base64');

  var memPool = new MemPool({
    fileContents: base64data,
    signedMessage: signedMessage.toString('hex'),
    dateAdded: new Date(),
    publicKey: publicKey,
    privateKey: privateKey
  });
  memPool.save();
  return base64data;
});

var GetMemPoolItem = (() => {

  var url = 'mongodb://localhost/CodeChain';

  MongoClient.connect(url, (error, client) => {
    debugger;
    if(error){
      console.log('Unable to connect tp Mongo');
      return;
    }
    console.log('Connected to Mongo DB');
    var db = client.db('CodeChain');

    //find returns a cursor, not actual records... just fyi
    //The query is the parameter of the find function below.
    db.collection('mempools').find({}).toArray().then((docs) => {
        console.log('Todos');
        docs.forEach((a) => {
          console.log(a);
        })
    }, (error) => {
      console.log('Error', error);
    });
    client.close();
  });
});

module.exports = {
   AddCodeFileToMemPool:AddCodeFileToMemPool,
   GetMemPoolItem
}
