var crypto = require('crypto');
var hashUtil = require('../utilities/hash.js');
var memPoolRepository = require('../repositories/mempoolRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');
var request = require('request');
var config = require('../config.json');
var transactionRepository = require('../repositories/transactionRepository');

//Adds a file to the mempool, from the fileService
var AddCodeFileToMemPool = (async (fileName, salt, base64FileContents, signedMessage, publicKey) => {
  var verified = await hashUtil.VerifyMessage(publicKey, signedMessage, salt + base64FileContents);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(fileName + base64FileContents + signedMessage + dateNow + salt);
  var mempoolItem = await memPoolRepository.AddCodeFileMemPoolItem(fileName, base64FileContents, signedMessage, publicKey, salt, dateNow, hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

//Adds an "incoming' file to the mempool.  "Incoming transactions" are transactions that were broadcast from other nodes, not submited via an endpoint.
var AddIncomingCodeFileToMemPool = (async (memPoolItem) => {

  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, memPoolItem.salt + memPoolItem.fileData.fileContents);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var saveResult = await memPoolRepository.AddCodeFileMemPoolItem(memPoolItem.fileData.fileName, memPoolItem.fileData.fileContents, memPoolItem.signedMessage, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash);
  BroadcastMempoolItemToRandomNodes(memPoolItem);
  return saveResult;
});

//Adds a transaction to the mempool, from the transactService
var AddTransactionToMemPool = (async (from, to, amount, salt, signedMessage, publicKey) => {
  let buff = new Buffer.from(`${from}${amount}${to}${salt}`);
  let base64data = buff.toString('base64');
  var verified = await hashUtil.VerifyMessage(publicKey, signedMessage, base64data);
  if (!verified) {
    throw new Error("Invalid signed message " + memPoolItem.hash);
  }
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(from + to + amount + signedMessage + dateNow + salt);
  var mempoolItem = await memPoolRepository.AddTransactionMemPoolItem(from, to, amount, signedMessage, publicKey, salt, dateNow, hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

//Adds an "incoming" transaction to the mempool. "Incoming transactions" are transactions that were broadcast from other nodes, not submited via an endpoint.
var AddIncomingTransactionToMemPool = (async (memPoolItem) => {
  let buff = new Buffer.from(`${memPoolItem.transactionData.from}${memPoolItem.transactionData.amount}${memPoolItem.transactionData.to}${memPoolItem.salt}`);
  let base64data = buff.toString('base64');
  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, base64data);
  if (!verified) {
    throw new Error("Invalid signed message on incoming memPoolItem " + memPoolItem.hash);
  }
  //let's check that the sender has enough funds.  
  var balance = await transactionRepository.GetBalance(memPoolItem.publicKey);
  if (balance < memPoolItem.transactionData.amount) {
    throw new Error("Insufficient balance.");
  }
  var mempoolItem = await memPoolRepository.AddTransactionMemPoolItem(memPoolItem.transactionData.from, memPoolItem.transactionData.to, memPoolItem.transactionData.amount,
    memPoolItem.signedMessage, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash.toString("hex"));
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
    debugger;
    if (!verified) {
      throw new Error("Failed to verify mempoolitems: ", memPoolItems);
    }
  }
  return true;
});

var ValidateMemPoolItem = (async (memPoolItem) => {
  if (memPoolItem.type == mempoolItemTypes.File) {
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, memPoolItem.salt + memPoolItem.fileData.fileContents);
    return verified;
  } else if (memPoolItem.type == mempoolItemTypes.MiningReward) {
    //Mining rewards are verified in blockController, before this function even gets called. 
    return true;
  } else if (memPoolItem.type == mempoolItemTypes.Transaction) {
    let buff = new Buffer.from(`${memPoolItem.transactionData.from}${memPoolItem.transactionData.amount}${memPoolItem.transactionData.to}${memPoolItem.salt}`);
    let base64data = buff.toString('base64');
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signedMessage, base64data);
    if (verified == true) {
      //let's check that the sender has enough funds.  
      var balance = await transactionRepository.GetBalance(memPoolItem.publicKeyHash);
      if (balance < memPoolItem.transactionData.amount) {
        return false;
      } else {
        return true;
      }
    } else {
      return false; //message was invalid
    }
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
  AddTransactionToMemPool,
  AddIncomingTransactionToMemPool
}
