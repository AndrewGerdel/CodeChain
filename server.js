const express = require('express');
const bodyParser = require('body-parser');
var config = require('./config.json');
const argv = require('yargs').argv
const fs = require('fs');
const crypto = require('crypto');

let port = config.network.myPort;

//get more details on unhandled rejection errors, because they can be cryptic
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, reason);
});

var app = express();
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(bodyParser.json({limit: '2mb', extended: true}));


//render out a simple default page. 
app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  POST to /uploadfile to add files. GET to /getfiles to retrieve a file by hash.');
});

const isDebug = process.execArgv.includes("--debug") || process.execArgv.includes("--inspect-brk") || process.execArgv.includes("--inspect") || process.execArgv.includes("--debug-brk")
if (isDebug == true) {
  console.log('Launching in debug mode. Backend process will launch debuggers on separate ports. (7778 and 7779)');
}

//start listening for node requests, and spin up any node-related processes.
var nodeService = require('./webServices/nodeService.js');
console.log('Syncing with the network...');

//If we don't have a unique identifier saved in the config, generate/save one now. 
if (!config.network.myUid || config.network.myUid == '') {
  config.network.myUid = crypto.randomBytes(16).toString('hex');
  fs.writeFile('config.json', JSON.stringify(config, null, 2), function (err) {
    if (err) {
      console.log(`Error saving config: ${err}`);
    }
  });
}


nodeService.StartService(app, isDebug, (() => {
  //We don't want to start any of the other services until the nodeService has done its work (updating the blockchain).

  //start the blockService, which pings the mempool at a defined interval and checks for work. 
  var blockService = require('./webServices/blockService.js');
  blockService.StartService(app, isDebug);

  //start listening for file requests
  var fileService = require('./webServices/fileService.js');
  fileService.StartService(app);

  //start the mempoolService, which facilitates mempool communication between nodes
  var mempoolService = require('./webServices/mempoolService.js');
  mempoolService.StartService(app, isDebug);

  var keyService = require('./webServices/keyService');
  keyService.StartService(app);

  var transactService = require('./webServices/transactService');
  transactService.StartService(app);

  //start listening for communications from users via a browser, or from other nodes on the network. 
  app.listen(port, () => {
    console.log('Server is up and running on port', port);
  });
}));



