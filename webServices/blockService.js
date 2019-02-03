let blockController = require('../controllers/blockController.js');
var nodeRepository = require('../repositories/nodeRepository');
var config = require('../config.json');
var blockLogger = require('../loggers/blockProcessLog');

var StartService = ((app, isDebug, callback) => {

  app.post('/block/add', async (req, res) => {
    try {
      var block = JSON.parse(req.body.block);
      var remoteNodeUid = req.body.uid;
      var remoteNode = await nodeRepository.GetNode(remoteNodeUid);
      if (!remoteNode || remoteNode.length == 0) {
        blockLogger.WriteLog(`Refusing block from unknown node: ${remoteNodeUid}`);
        res.send({ Success: false, Error: `Refusing block from unknown node: ${remoteNodeUid}` });
      } else if (remoteNode[0].blacklistUntilBlock && remoteNode[0].blacklistUntilBlock > 0) {
        blockLogger.WriteLog(`Refusing block from blacklisted node: ${remoteNodeUid}`);
        res.send({ Success: false, Error: `Refusing block from blacklisted node: ${remoteNodeUid}` });
      } else {
        var success = await blockController.ValidateAndAddIncomingBlock(block)
        res.send({ Success: success });
      }
    } catch (ex) {
      res.send({ Success: false, Exception: ex });
    }
  });

  app.get('/block/getBlocks', (req, res) => {
    var startingBlock = req.query.startingBlock;
    blockController.GetBlocksFromStartingBlock(startingBlock)
      .then((blocks) => {
        res.send(blocks);
      }, (err) => {
        res.send('Error sending blocks');
        blockLogger.WriteLog('Error sending blocks. ', err);
      })
  });

  app.get('/block/getBlock', (req, res) => {
    var blockNumber = Number(req.query.blockNumber);
    blockController.GetBlock(blockNumber)
      .then((block) => {
        res.send(block);
      }, (err) => {
        res.send('Error sending block');
        blockLogger.WriteLog('Error sending block ', err);
      })
  });

  app.get('/block/getBlockHash', (req, res) => {
    var blockNumber = Number(req.query.blockNumber);
    blockController.GetBlockHash(blockNumber)
      .then((blockHash) => {
        res.send(blockHash);
      }, (err) => {
        res.send('Error sending block hash');
        blockLogger.WriteLog('Error sending block hash', err);
      })
  });

  app.get('/block/getBlockHashes', (req, res) => {
    var startingBlock = req.query.startingBlock;
    blockController.GetBlockHashesFromStartingBlock(startingBlock)
      .then((blocks) => {
        res.send(blocks);
      }, (err) => {
        res.send('Error sending blocks');
        blockLogger.WriteLog('Error sending blocks. ', err);
      })
  });


  //If the blockchain is empty, create the genesis block now. 
  blockController.GetLastBlock()
    .then((lastBlock) => {
      if (lastBlock.length == 0) {
        blockController.CreateGenesisBlock(lastBlock)
          .then((newBlock) => {
            StartOrForkProcess(isDebug, callback);
            // blockController.AddBlock(newBlock[0]) //don't add the block again. It's already been added by CreateGenesisBlock()
          }, (err) => {
            throw new Error('Failed to create genesis block: ' + err);
          })
      } else {
        StartOrForkProcess(isDebug, callback);
      }
    });
});

function StartOrForkProcess(isDebug, callback) {
  if (!config.mining.address || config.mining.address == '') {
    blockLogger.WriteLog('Public key not set in config. Mining will not start.', true);
  } else {
    if (isDebug) {
      //Run the backend block processes on a child thread with inspect-brk.
      //NOTE: In chrome, 'Open dedicated DevTools for Node'.  Add localhost:7778 and localhost:7779
      console.log(`Launching block process attached to debugger on port 7779.`);
      const { fork } = require('child_process');
      const forked = fork('processServices/blockProcess.js', [], { execArgv: ['--inspect-brk=7779'] });
    } else {
      //Run the backend block processes on a child thread
      const { fork } = require('child_process');
      const forked = fork('processServices/blockProcess.js');
    }
  }
  if (callback) {
    callback();
  }
}

module.exports = {
  StartService
} 