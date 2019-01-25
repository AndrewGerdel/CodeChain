var crypto = require('crypto');
var hashUtil = require('../utilities/hash.js');
var memPoolRepository = require('../repositories/mempoolRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');
var request = require('request');
var config = require('../config.json');
var transactionRepository = require('../repositories/transactionRepository');
var blockLogger = require('../loggers/blockProcessLog');

//Adds a file to the mempool, from the fileService
var AddCodeFileToMemPool = (async (fileName, salt, base64FileContents, signature, publicKey, repo, memo) => {
  var verified = await hashUtil.VerifyMessage(publicKey, signature, salt + base64FileContents + repo);
  if (!verified) {
    throw new Error("Invalid signature");
  }
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(fileName + base64FileContents + signature + salt + memo);
  var mempoolItem = await memPoolRepository.AddCodeFileMemPoolItem(fileName, base64FileContents, signature, publicKey, salt, dateNow, hash.toString("hex"), repo, memo);
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

//Adds an "incoming' file to the mempool.  "Incoming transactions" are transactions that were broadcast from other nodes, not submited via an endpoint.
var AddIncomingCodeFileToMemPool = (async (memPoolItem, incomingFromNodeUid) => {

  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, memPoolItem.salt + memPoolItem.fileData.fileContents + memPoolItem.fileData.repo);
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var saveResult = await memPoolRepository.AddCodeFileMemPoolItem(memPoolItem.fileData.fileName, memPoolItem.fileData.fileContents, memPoolItem.signature, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash);
  BroadcastMempoolItemToRandomNodes(memPoolItem, incomingFromNodeUid);
  return saveResult;
});

//Adds a transaction to the mempool, from the transactService
var AddTransactionToMemPool = (async (from, to, amount, salt, signature, publicKey, memo) => {
  let buff = new Buffer.from(`${from}${amount}${to}${salt}`);
  let base64data = buff.toString('base64');
  var verified = await hashUtil.VerifyMessage(publicKey, signature, base64data);
  if (!verified) {
    throw new Error("Invalid transaction " + from + " to " + to);
  }
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(from + to + amount + signature + dateNow + salt + memo);
  var mempoolItem = await memPoolRepository.AddTransactionMemPoolItem(from, to, amount, signature, publicKey, salt, dateNow, hash.toString("hex"), memo);
  BroadcastMempoolItemToRandomNodes(mempoolItem, '');
  return mempoolItem;
});

//Adds an "incoming" transaction to the mempool. "Incoming transactions" are transactions that were broadcast from other nodes, not submited via an endpoint.
var AddIncomingTransactionToMemPool = (async (memPoolItem, incomingFromNodeUid) => {
  let buff = new Buffer.from(`${memPoolItem.transactionData.from}${memPoolItem.transactionData.amount}${memPoolItem.transactionData.to}${memPoolItem.salt}`);
  let base64data = buff.toString('base64');
  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, base64data);
  if (!verified) {
    throw new Error("Invalid signed message on incoming memPoolItem " + memPoolItem.hash);
  }
  //NOTE: Don't validate funds on mempool-adds.  They will get validated when they are added to a block. 
  // //let's check that the sender has enough funds.  
  // var balance = await transactionRepository.GetBalance(memPoolItem.address);
  // if (balance < memPoolItem.transactionData.amount) {
  //   throw new Error("Insufficient balance.");
  // }
  var mempoolItem = await memPoolRepository.AddTransactionMemPoolItem(memPoolItem.transactionData.from, memPoolItem.transactionData.to, memPoolItem.transactionData.amount,
    memPoolItem.signature, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem, incomingFromNodeUid);
  return mempoolItem;
});


//Adds a message to the mempool, from the messageService
var AddMessageToMemPool = (async (senderPublicKey, recipientPublicKey, encryptedMessage, salt, signature, memo) => {
  var from = await hashUtil.CreateSha256Hash(senderPublicKey);
  var to = await hashUtil.CreateSha256Hash(recipientPublicKey);
  var verified = await hashUtil.VerifyMessage(senderPublicKey, signature, `${salt}${encryptedMessage}`);
  if (!verified) {
    throw new Error("Invalid transaction " + from.toString('hex') + " to " + to.toString('hex'));
  }
  var dateNow = new Date();
  var hash = await hashUtil.CreateSha256Hash(`${salt}${encryptedMessage}`);
  var mempoolItem = await memPoolRepository.AddMessageMemPoolItem(from.toString('hex'), to.toString('hex'), encryptedMessage, signature, senderPublicKey, salt, dateNow, hash.toString("hex"), memo);
  BroadcastMempoolItemToRandomNodes(mempoolItem, '');
  return mempoolItem;
});

//Adds a message to the mempool, from the messageService
var AddIncomingMessageToMemPool = (async (memPoolItem, incomingFromNodeUid) => {

  var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, `${memPoolItem.salt}${memPoolItem.messageData.messageText}`);
  if (!verified) {
    throw new Error("Invalid signed message on incoming memPoolItem " + memPoolItem.hash);
  }
  var mempoolItem = await memPoolRepository.AddMessageMemPoolItem(memPoolItem.messageData.from, memPoolItem.messageData.to, memPoolItem.messageData.messageText,
    memPoolItem.signature, memPoolItem.publicKey, memPoolItem.salt, memPoolItem.dateAdded, memPoolItem.hash.toString("hex"));
  BroadcastMempoolItemToRandomNodes(mempoolItem, incomingFromNodeUid);
  return mempoolItem;
});

var BroadcastMempoolItemToRandomNodes = (async (mempoolItem, incomingFromNodeUid) => {
  //hardcoded to broadcast to 10 nodes.  Consider calculating this value as the network grows.
  var randomNodes = await nodeRepository.GetRandomNodes(10);

  randomNodes.forEach((node) => {
    if (node.uid != config.network.myUid && node.uid != incomingFromNodeUid) { //Don't broadcast a mempool to ourselves OR to the node that broadcast it to us. 
      blockLogger.WriteLog(`Sending memPoolItem ${mempoolItem.hash} to ${node.uid}`);
      var nodeEndpoint = `${node.protocol}://${node.uri}:${node.port}/mempool/add`;

      var options = {
        url: nodeEndpoint,
        method: 'POST',
        json: { uid: config.network.myUid, mempoolItem: JSON.stringify(mempoolItem) }
      };
      request(options, (err, res, body) => {
        //There's really nothing to do here.  Broadcast it and forget it. 
      });
    }

  });
  return;
});

var ValidateMemPoolItemsOnIncomingBlock = (async (memPoolItems) => {
  for (i = 0; i < memPoolItems.length; i++) {
    if (memPoolItems[i].type == mempoolItemTypes.MiningReward && i != 0) {
      throw new Error("Failed to validate incoming block. MiningReward only allowed as the first element.");
    }
    var verified = await ValidateMemPoolItemOnIncomingBlock(memPoolItems[i]);
    if (!verified) {
      throw new Error("Failed to verify mempoolitems: ", memPoolItems[i]);
    }
  }
  return true;
});

var ValidateMemPoolItemOnIncomingBlock = (async (memPoolItem) => {
  if (memPoolItem.type == mempoolItemTypes.File) {
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, memPoolItem.salt + memPoolItem.fileData.fileContents + memPoolItem.fileData.repo);
    if (!verified)
      blockLogger.WriteLog(`Failed to verify message on incoming block. ${memPoolItem.hash}`);
    return verified;
  } else if (memPoolItem.type == mempoolItemTypes.Message) {
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, `${memPoolItem.salt}${memPoolItem.messageData.messageText}`);
    if (!verified) {
      throw new Error("Invalid signed message on incoming memPoolItem " + memPoolItem.hash);
    }
    return verified;
  } else if (memPoolItem.type == mempoolItemTypes.MiningReward) {
    //Mining rewards are verified in blockController, before this function even gets called. 

    //ANDREW, CHANGE THIS.


    return true;
  } else if (memPoolItem.type == mempoolItemTypes.Transaction) {
    let buff = new Buffer.from(`${memPoolItem.transactionData.from}${memPoolItem.transactionData.amount}${memPoolItem.transactionData.to}${memPoolItem.salt}`);
    let base64data = buff.toString('base64');
    var verified = await hashUtil.VerifyMessage(memPoolItem.publicKey, memPoolItem.signature, base64data);
    if (verified == true) {
      //let's check that the sender has enough funds.  
      var balance = await transactionRepository.GetBalance(memPoolItem.address);
      if (balance < memPoolItem.transactionData.amount) {
        blockLogger.WriteLog(`Failed to verify message on incoming block, insufficient funds. Transaction  ${memPoolItem.hash}`);
        return false;
      } else {
        return true;
      }
    } else {
      if (!verified)
        blockLogger.WriteLog(`Failed to verify message on incoming block. Transaction  ${memPoolItem.hash}`);
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
  ValidateMemPoolItemsOnIncomingBlock,
  GetMemPoolItem,
  AddIncomingCodeFileToMemPool,
  AddTransactionToMemPool,
  AddIncomingTransactionToMemPool,
  AddMessageToMemPool,
  AddIncomingMessageToMemPool
}
