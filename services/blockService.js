let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
var config = require('../config.json');

var StartService = ((app) => {
  app.post('/block/add', (req, res) => {
    var block = JSON.parse(req.headers.block);
    blockController.ValidateAndAddBlock(block)
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

  MempoolLoop();
});

function MempoolLoop() {
  debugger;
  MineNextBlock().then((result) => {
    setTimeout(MempoolLoop, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  }, (err) => {
    if (err != "") {
      console.log(err);
    }
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