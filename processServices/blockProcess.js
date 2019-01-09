let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
var config = require('../config.json');

MempoolLoop();

function MempoolLoop() {
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
        console.log(`Solved block ${block.blockNumber} in ${block.millisecondsBlockTime}ms`);
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

module.exports ={
  MempoolLoop
}