let blockController = require('../controllers/blockController.js');
let nodeController = require('../controllers/nodeController.js');
let blockLogger = require('../loggers/blockProcessLog');

const timerIntervalMs = 500;

process.on('unhandledRejection', (reason, promise) => {
  blockLogger.WriteLog('Error (unhandled rejection) in nodeProcess: ' + reason);
});

blockLogger.WriteLog('Block process started.', true);
MempoolLoop();

async function MempoolLoop() {
  try {
    var result = await MineNextBlock();
  } catch (ex) {
    blockLogger.WriteLog('Error in blockProcess:' + ex);
  } finally {
    setTimeout(MempoolLoop, timerIntervalMs); //recursively call yourself. 
  }
}

async function MineNextBlock() {

  var block = await blockController.MineNextBlock();
  if (block) {
    blockLogger.WriteLog(`Solved block ${block.blockNumber} in ${block.millisecondsBlockTime}ms`, true);
    await nodeController.BroadcastBlockToNetwork(block);
    return block;
  }
}

module.exports = {
  MempoolLoop
}