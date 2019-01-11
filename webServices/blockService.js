let blockController = require('../controllers/blockController.js');
var config = require('../config.json');

var StartService = ((app, isDebug) => {
  app.post('/block/add', (req, res) => {
    var block = JSON.parse(req.headers.block);
    blockController.ValidateAndAddIncomingBlock(block)
      .then((success) => {
        res.send(success);
      }, (err) => {
        res.send(err);
        console.log(`Error validating block: ${err}`);
      })
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
    debugger;
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
  if (isDebug) {
    //if debugging, do not run on it's own thread. 
    var blockProcess = require('../processServices/blockProcess.js');
    blockProcess.MempoolLoop();
  } else {
    //Run the backend block processes on a child thread
    const { fork } = require('child_process');
    const forked = fork('processServices/blockProcess.js');
  }
}

module.exports = {
  StartService
} 