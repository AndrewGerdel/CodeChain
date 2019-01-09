let blockController = require('../controllers/blockController.js');
var config = require('../config.json');

var StartService = ((app, isDebug) => {
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

  //Run the backend block processes on a child thread
  const { fork } = require('child_process');
  const forked = fork('processServices/blockProcess.js');

  // if(isDebug) {
  //   //if debugging, do not run on it's own thread. 
  //   var blockProcess = require('../processServices/blockProcess.js');
  //   blockProcess.MempoolLoop();
  // }else {
  //    //Run the backend block processes on a child thread
  //    const { fork } = require('child_process');
  //    const forked = fork('processServices/blockProcess.js');
  // }
});


module.exports = {
  StartService
} 