let blockController = require('../controllers/blockController.js');
var nodeRepository = require('../repositories/nodeRepository');
var config = require('../config.json');

var StartService = ((app, isDebug) => {

  app.post('/block/add', async(req, res) => {
    var block = JSON.parse(req.body.block);
    var remoteNodeUid = JSON.parse(req.body.uid);
    var remoteNode = await nodeRepository.GetNode(remoteNodeUid);
    if (!remoteNode || remoteNode.length == 0) {
      console.log(`Refusing block from unknown node: ${remoteNodeUid}`);
      res.send({Success: false, Error: `Refusing block from unknown node: ${remoteNodeUid}`});
    } else if (remoteNode[0].blacklistUntilBlock && remoteNode[0].blacklistUntilBlock > 0) {
      console.log(`Refusing block from blacklisted node: ${remoteNodeUid}`);
      res.send({Success: false, Error: `Refusing block from unknown node: ${remoteNodeUid}`});
    } else {
      var success = await blockController.ValidateAndAddIncomingBlock(block)
      res.send({Success: success});
    }
  });

  app.get('/block/getBlocks', (req, res) => {
    var startingBlock = req.query.startingBlock;
    blockController.GetBlocksFromStartingBlock(startingBlock)
      .then((blocks) => {
        res.send(blocks);
      }, (err) => {
        res.send('Error sending blocks');
        console.log('Error sending blocks. ', err);
      })
  });

  app.get('/block/getBlock', (req, res) => {
    var blockNumber = Number(req.query.blockNumber);
    blockController.GetBlock(blockNumber)
      .then((block) => {
        res.send(block);
      }, (err) => {
        res.send('Error sending block');
        console.log('Error sending block ', err);
      })
  });

  app.get('/block/getBlockHash', (req, res) => {
    var blockNumber = Number(req.query.blockNumber);
    blockController.GetBlockHash(blockNumber)
      .then((blockHash) => {
        res.send(blockHash);
      }, (err) => {
        res.send('Error sending block hash');
        console.log('Error sending block hash', err);
      })
  });

  app.get('/block/getBlockHashes', (req, res) => {
    var startingBlock = req.query.startingBlock;
    blockController.GetBlockHashesFromStartingBlock(startingBlock)
      .then((blocks) => {
        res.send(blocks);
      }, (err) => {
        res.send('Error sending blocks');
        console.log('Error sending blocks. ', err);
      })
  });


  //If the blockchain is empty, create the genesis block now. 
  blockController.GetLastBlock()
    .then((lastBlock) => {
      if (lastBlock.length == 0) {
        blockController.CreateGenesisBlock(lastBlock)
          .then((newBlock) => {
            StartOrForkProcess(isDebug);
            // blockController.AddBlock(newBlock[0]) //don't add the block again. It's already been added by CreateGenesisBlock()
          }, (err) => {
            throw new Error('Failed to create genesis block: ' + err);
          })
      } else {
        StartOrForkProcess(isDebug);
      }
    });
});

function StartOrForkProcess(isDebug) {
  if (!config.mining.publicKey || config.mining.publicKey == '') {
    console.log('Public key not set in config. Mining will not start.');
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

}

module.exports = {
  StartService
} 