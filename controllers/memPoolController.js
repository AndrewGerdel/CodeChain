var { MongoClient } = require('mongodb');
var keyController = require('./keyController.js');
var nodeController = require('./nodeController.js');
var crypto = require('crypto');
var hashUtil = require('../utilities/hash.js');
var memPoolRepository = require('../repositories/mempoolRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');
var request = require('request');
var crypto = require('crypto');

//Adds a file to the mempool.
var AddCodeFileToMemPool2 = (async (memPoolItem) => {
  
  var abc = hashUtil.VerifySignedMessage(memPoolItem.fileData.fileContents, memPoolItem.signedMessage, memPoolItem.publicKey);

  var verified = await keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer.from(publicKey, 'hex'));
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var salt = crypto.randomBytes(16).toString('hex');
  var dateNow = new Date();
  var mempoolItem = await memPoolRepository.AddMemPoolItem(fileName, base64data, signedMessage, publicKey, salt, dateNow);
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

//Adds a file to the mempool.
var AddCodeFileToMemPool = (async (fileName, fileContents, signedMessage, publicKey) => {
  let buff = new Buffer.from(fileContents);
  let base64data = buff.toString('base64');
  var verified = await keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, new Buffer.from(publicKey, 'hex'));
  if (!verified) {
    throw new Error("Invalid signed message");
  }
  var salt = crypto.randomBytes(16).toString('hex');
  var dateNow = new Date();
  var mempoolItem = await memPoolRepository.AddMemPoolItem(fileName, base64data, signedMessage, publicKey, salt, dateNow);
  BroadcastMempoolItemToRandomNodes(mempoolItem);
  return mempoolItem;
});

var BroadcastMempoolItemToRandomNodes = (async (mempoolItem) => {
  //hardcoded to broadcast to 10 nodes.  Consider calculating this value as the network grows.
  var randomNodes = await nodeRepository.GetRandomNodes(10);
  randomNodes.forEach((node) => {

    var options = {
      url: nodeEndpoint,
      method: 'POST',
      headers: { myVal: JSON.stringify(mempoolItem) }
    };


    var nodeEndpoint = `${node.protocol}://${node.uri}:${node.port}/mempool/add`;

    var options = {
      url: nodeEndpoint,
      method: 'POST',
      headers: { mempoolItem: JSON.stringify(mempoolItem) }
    };
    request(options, (err, res, body) => {
      //There's really nothing to do here.  Broadcast it and forget it. 
    });
  });
  return;
});


var ValidateMemPoolItems = (async (memPoolItems) => {
  for (i = 0; i < memPoolItems; i++) {
    var verified = await ValidateMemPoolItem(memPoolItems[i]);
    if (!verified) {
      throw new Error("Failed to verify mempoolitems: ", memPoolItems);
    }
  }
  return true;
});

var ValidateMemPoolItem = (async (memPoolItem) => {
  debugger;
  if (memPoolItem.type == mempoolItemTypes.File) {

    return hashUtil.VerifySignedMessage(memPoolItems[i].fileData.fileContents, memPoolItems[i].signedMessage, memPoolItems[i].publicKey);
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
  AddCodeFileToMemPool2
}
