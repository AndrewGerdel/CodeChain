let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
var config = require('../config.json');

var StartService = ((app) => {
  app.post('/block/add', (req, res) => {
    blockController.ValidateBlock(req.headers.block);
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
        console.log(`Solved block ${block.Block.blockNumber}`);
        nodeController.BroadcastBlockToNetwork(block.Block);
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