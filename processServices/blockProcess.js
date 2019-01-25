let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
const timerIntervalMs = 500;

process.on('unhandledRejection', (reason, promise) => {
  console.log('Error (unhandled rejection) in nodeProcess: ', reason);
});

console.log('Block process starting...');
MempoolLoop();

async function MempoolLoop() {
  try {
    var result = await MineNextBlock();
  } catch (ex) {
    console.log('Error in blockProcess:', ex);
  } finally {
    setTimeout(MempoolLoop, timerIntervalMs); //recursively call yourself. 
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