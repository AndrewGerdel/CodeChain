var {MemPool} = require('../models/mempool.js');
var MemPoolController = require('./memPoolController.js');
var {MongoClient} = require('mongodb');
var {Block} = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var mongoose = require('../db/mongoose.js');
var memPoolItems = [];
var nonce = 0;

const maxBlockSizeBytes = 1000000;
 var startingDifficulty = "0x000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Adds memPoolItems to the collection, then fires SolveBlock
function MineNextBlock(){
  GetLastBlock()
    .then((lastBlock) => {
      if(lastBlock.length == 0){
          //there are no blocks.  Create the genesis block.
          var newBlock = CreateNewBlock('68f64f11fdcb97cdc5b4f52726cf923e6d3bc6f41f153ce91b7532221fa48fd7', 1, 'None', [], 0);
          lastBlock.push(newBlock);
      }
      // console.log('the last block is:', lastBlock[0].blockNumber);
      MemPoolController.GetMemPoolItems()
        .then((memPoolItemsFromDb) => {
          var sumFileSizeBytes = 0;
          var counter = 0;
          if(memPoolItemsFromDb.length > 0) {
            console.log('MempoolItems found:', memPoolItemsFromDb.length, 'Working on them now...');
            for(i=0;i<memPoolItemsFromDb.length;i++){
               var element = memPoolItemsFromDb[i];
               var fileSizeBytes = (element.fileContents.length * 0.75) - 2;
               sumFileSizeBytes += fileSizeBytes;
               memPoolItems.push(memPoolItemsFromDb[i]);
               // console.log(element._id, "File name:", element.fileName,  "File Size:", fileSizeBytes);
               if(sumFileSizeBytes >= maxBlockSizeBytes){
                   break;
               }
             }//endfor
             SolveBlock(hexToDec(startingDifficulty), lastBlock[0])
              .then((hashResult) => {
                console.log(hashResult);
              })
              .catch((error) => {
                console.log('Error in GetMemPoolItems', error);
              });
            }
          })
        .catch((error) =>  { console.log(error); });
  });
}


//Hashes the current mempool items along with a nonce and datetime until below supplied difficulty.
var SolveBlock = ((difficulty, previousBlock) => {
  var promise = new Promise((resolve, reject) => {
    var startingDateTime = new Date();
    var effectiveDate = new Date();
    do{
      var hash = crypto.createHmac('sha256', nonce + effectiveDate + MemPoolItemsAsJson()).digest('hex');
      var hashAsDecimal = hexToDec(hash);
      if(hashAsDecimal <= difficulty)  {
        var endingDateTime = new Date();
        var millisecondsBlockTime = (endingDateTime-startingDateTime);
        var newBlock = CreateNewBlock(hash, previousBlock.blockNumber + 1, previousBlock.blockHash, memPoolItems, millisecondsBlockTime)
        resolve({ Block : newBlock, Nonce: nonce, Now: effectiveDate  });
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

// Creates a new block, pointing to the previous block, and recording mempoolitems, etc
var CreateNewBlock = ((hash, blockNumber, previousBlockHash, memPoolItems, millisecondsBlockTime) => {
  var newBlock = new Block({
    blockHash: hash,
    blockNumber: blockNumber,
    previousBlockHash: previousBlockHash,
    data: memPoolItems,
    millisecondsBlockTime: millisecondsBlockTime
  });
  newBlock.save();

  MemPoolController.DeleteMemPoolItems(memPoolItems)
    .then((result) => { console.log('Cleared mempool items');})
    .catch((error) => { console.log('Error clearing mempool', error);})

  return newBlock;
});

//Gets the most recent block from the chain
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

//Converts all current memPoolItems to json for easy hashing.
function MemPoolItemsAsJson(){
  var memPoolItemsJson;
  for(i=0;i<memPoolItems.length;i++){
    memPoolItemsJson += JSON.stringify(memPoolItems[i]);
  }
  return memPoolItemsJson;
}

module.exports = {
  SolveBlock,
  GetLastBlock,
  MineNextBlock
}
