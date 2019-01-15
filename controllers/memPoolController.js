var crypto = require('crypto');
var hashUtil = require('../utilities/hash.js');
var memPoolRepository = require('../repositories/mempoolRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');
var request = require('request');
var config = require('../config.json');
var blockRepositry = require('../repositories/blockRepository');

//Adds an "incoming' file to the mempool.  Incoming transactions are broadcast from other nodes, not submited via an endpoint.
var AddIncomingCodeFileToMemPool = (async (memPoolItem) => {

  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, memPoolItem.fileData.fileContents);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var saveResult = await memPoolRepository.AddMemPoolItem(memPoolItem.fileData.fileName, memPoolItem.fileData.fileContents, memPoolItem.signedMessage, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash);
  BroadcastMempoolItemToRandomNodes(memPoolItem);
  return saveResult;
});

//Adds an "incoming" transaction to the mempool. Incoming transactions are broadcast from other nodes, not submited via an endpoint.
var AddIncomingTransactionToMemPool = (async (memPoolItem) => {

  throw new Error("todo");
  // blockRepositry.GetBalance(memPoolItem)
  // blockR

  // var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, memPoolItem.transactionData);
  // if (!verified) {
  //   throw new Error("Invalid signed message");
  // }
  // var saveResult = await memPoolRepository.AddTransactionMemPoolItem(memPoolItem.transactionData.from, memPoolItem.transactionData.to, memPoolItem.transactionData.amount, memPoolItem.signedMessage, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash);
  // BroadcastMempoolItemToRandomNodes(memPoolItem);
  // return saveResult;
});

//Adds a file to the mempool, from the fileService
var AddCodeFileToMemPool = (async (fileName, base64FileContents, signedMessage, publicKey) => {
  var verified = await hashUtil.VerifyMessage(publicKey, signedMessage, base64FileContents);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var salt = crypto.randomBytes(16).toString('hex');
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(fileName + base64FileContents + signedMessage + dateNow + salt);
  var mempoolItem = await memPoolRepository.AddMemPoolItem(fileName, base64FileContents, signedMessage, publicKey, salt, dateNow, hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

//Adds a transaction to the mempool, from the transactService
var AddTransactionToMemPool = (async (from, to, amount, signedMessage, publicKey) => {
  let buff = new Buffer.from(`${from}${amount}${to}`);
  let base64data = buff.toString('base64');
  var verified = await hashUtil.VerifyMessage(publicKey, signedMessage, base64data);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var salt = crypto.randomBytes(16).toString('hex');
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(from + to + amount + signedMessage + dateNow + salt);
  var mempoolItem = await memPoolRepository.AddTransactionMemPoolItem(from, to, amount, signedMessage, publicKey, salt, dateNow, hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});


var BroadcastMempoolItemToRandomNodes = (async (mempoolItem) => {
  //hardcoded to broadcast to 10 nodes.  Consider calculating this value as the network grows.
  var randomNodes = await nodeRepository.GetRandomNodes(10);

  randomNodes.forEach((node) => {
    if (node.uid != config.network.myUid) { //Don't broadcast a mempool to our self.
      console.log(`Sending memPoolItem ${mempoolItem.hash} to ${node.port}`);
      var nodeEndpoint = `${node.protocol}://${node.uri}:${node.port}/mempool/add`;

      var options = {
        url: nodeEndpoint,
        method: 'POST',
        headers: { mempoolItem: JSON.stringify(mempoolItem) }
      };
      request(options, (err, res, body) => {
        //There's really nothing to do here.  Broadcast it and forget it. 
      });
    }

  });
  return;
});


var ValidateMemPoolItems = (async (memPoolItems) => {
  for (i = 0; i < memPoolItems.length; i++) {
    var verified = await ValidateMemPoolItem(memPoolItems[i]);
    if (!verified) {
      throw new Error("Failed to verify mempoolitems: ", memPoolItems);
    }
  }
  return true;
});

var ValidateMemPoolItem = (async (memPoolItem) => {
  if (memPoolItem.type == mempoolItemTypes.File) {
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, memPoolItem.fileData.fileContents);
    return verified;
  } else if (memPoolItem.type == mempoolItemTypes.MiningReward) {
    //Mining rewards are verified in blockController, before this function even gets called. 
    return true;
  } else {
    throw new Error(`Unknown memPoolItem type: ${memPoolItem.type}`);
  }
});

var GetMemPoolItem = (async (hash) => {
  return await memPoolRepository.GetMemPoolItem(hash);
});


module.exports = {
  AddCodeFileToMemPool,
  ValidateMemPoolItems,
  GetMemPoolItem,
  AddIncomingCodeFileToMemPool,
  AddTransactionToMemPool
}
