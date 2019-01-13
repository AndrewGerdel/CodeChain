let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
var config = require('../config.json');

console.log('Block process starting...');
MempoolLoop();

async function MempoolLoop() {
  try {
    var result = await MineNextBlock();
  } catch (ex) {
    console.log('Error in blockProcess:', ex);
  } finally {
    setTimeout(MempoolLoop, config.timers.primaryTimerIntervalMs); //recursively call yourself. 
  }
}

async function MineNextBlock() {
  var block = await blockController.MineNextBlock();
  if (block) {
    console.log(`Solved block ${block.blockNumber} in ${block.millisecondsBlockTime}ms`);
    await nodeController.BroadcastBlockToNetwork(block);
    return block;
  }
}

module.exports = {
  MempoolLoop
}