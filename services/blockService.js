let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
var config = require('../config.json');

var StartService = ((app) => {
  app.post('/block/add', (req, res) => {
    var block = JSON.parse(req.headers.block);
    blockController.ValidateBlockHash(block)
      .then((result) => {
        console.log(`Successfully validated block hash ${block.blockNumber}`);
        blockController.GetLastBlock()
          .then((lastBlock) => {
            if (block.blockNumber != lastBlock[0].blockNumber + 1) {
              res.send("Invalid block number");
              console.log("Invalid block number.", block.blockNumber, lastBlock[0].blockNumber);
            } else {
              if (block.previousBlockHash != lastBlock[0].blockHash) {
                res.send("Invalid previous block hash");
                console.log("Invalid previous block hash.", previousBlockHash, lastBlock[0].blockHash);
              } else {
                blockController.AddBlock(block)
                  .then((addBlockResult) => {
                    res.send(`Successfully imported block ${block.blockNumber}`);
                    console.log(`Successfully imported block ${block.blockNumber}`);
                  }, (err) => {
                    res.send(`Error adding block to blockchain`);
                    console.log(`Error adding block to blockchain. ${err}`);
                  })

              }
            }
          }, (err) => {
            res.send("Failed to retrieve local block");
            console.log("Failed to retrieve local block.", err);
          });
      }, (err) => {
        res.send("Failed to validate block hash");
        console.log("Failed to validate block hash");
      });
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

  MempoolLoop();
});

function MempoolLoop() {
  MineNextBlock().then((result) => {
    setTimeout(MempoolLoop, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  }, (err) => {
    // console.log(err);
    setTimeout(MempoolLoop, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  })
}

function MineNextBlock() {
  // console.log('Checking mempool...');
  var promise = new Promise((resolve, reject) => {
    blockController.MineNextBlock()
      .then((block) => {
        console.log(`Solved block ${block.blockNumber}`);
        nodeController.BroadcastBlockToNetwork(block);
        resolve(block);
      }, (err) => {
        reject(err);
      })
      .catch((ex) => {
        console.log(`Critical error: ${ex}`);
      });
  });
  return promise;
}

module.exports = {
  StartService
} 