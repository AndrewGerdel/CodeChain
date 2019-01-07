let blockController = require('../controllers/blockController.js');
var config = require('../config.json');

//Every x seconds, look for more data to mine.
var StartService = (() => {
  MineNextBlock().then((result) => {
    debugger;
    setTimeout(StartService, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  }, (err) => {
    // console.log(err);
    setTimeout(StartService, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  })
});

function MineNextBlock() {
  // console.log('Checking mempool...');
  var promise = new Promise((resolve, reject) => {
    blockController.MineNextBlock()
      .then((block) => {
        console.log(`Solved block ${block.Block.blockNumber}`)
        resolve(block.Block);
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