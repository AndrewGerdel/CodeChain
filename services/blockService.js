let blockController = require('../controllers/blockController.js');

//Every 2 seconds, look for more data to mine.
var StartService = (() => {
    setInterval(Timer_MineNextBlock, 2000);
});

function Timer_MineNextBlock() {
  console.log('Checking mempool...');
  blockController.MineNextBlock();
}

module.exports = {
    StartService
}