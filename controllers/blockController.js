var {MemPool} = require('../models/mempool.js');
var {MongoClient} = require('mongodb');
var {Block} = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');

var memPoolItems = [];
var nonce = 0;

var AddMemPoolItemToBlock = ((memPoolItem) => {
  memPoolItems.push(memPoolItem);
});

var HashBlock = ((difficulty, previousBlock) => {
  var promise = new Promise((resolve, reject) => {
    var startingDateTime = new Date();
    var effectiveDate = new Date();
    do{
      var hash = crypto.createHmac('sha256', nonce + effectiveDate + MemPoolItemsAsJson()).digest('hex');
      var hashAsDecimal = hexToDec(hash);
      if(hashAsDecimal <= difficulty)  {
        var endingDateTime = new Date();
        var newBlock = CreateNewBlock(hash, previousBlock.blockNumber + 1, previousBlock.blockHash, memPoolItems)
        resolve({ Block : newBlock, Nonce: nonce, Now: effectiveDate, TotalMilliseconds: (endingDateTime-startingDateTime) });
      }
      nonce++;
      if(nonce >= Number.MAX_SAFE_INTEGER){
        nonce = 0;
        effectiveDate =  new Date();
      }
    }while(hashAsDecimal > difficulty)
  });
  return promise;
});


var CreateNewBlock = ((hash, blockNumber, previousBlockHash, memPoolItems) => {
  var newBlock = new Block({
    blockHash: hash,
    blockNumber: blockNumber,
    previousBlockHash: previousBlockHash,
    data: memPoolItems
  });
  newBlock.save();
  return newBlock;
});

var GetLastBlock = (() => {
  var promise = new Promise((resolve, reject) => {
    var url = 'mongodb://localhost/CodeChain';
    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
      if(error){
        console.log('Unable to connect to Mongo');
        return;
      }
      var db = client.db('CodeChain');
      var lastBlock = db.collection('blocks').find().sort({blockNumber:-1}).limit(1).toArray();

      resolve(lastBlock);
    });
  });
  return promise;
});

function MemPoolItemsAsJson(){
  var memPoolItemsJson;
  for(i=0;i<memPoolItems.length;i++){
    memPoolItemsJson += JSON.stringify(memPoolItems[i]);
  }
  return memPoolItemsJson;
}

module.exports = {
  AddMemPoolItemToBlock,
  HashBlock,
  GetLastBlock,
  CreateNewBlock
}
