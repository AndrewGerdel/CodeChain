const express = require('express');
const bodyParser = require('body-parser');
var config = require('./config.json');

let port = config.network.myPort;

//get more details on unhandled rejection errors, because they can be cryptic
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, reason);
});

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//render out a simple default page. 
app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  POST to /uploadfile to add files. GET to /getfiles to retrieve a file by hash.');
});

// const isDebug = argv && (argv.includes('inspect') || argv.includes('debug'));
// console.log('is debug', isDebug);
var isDebug = false; //temp

//start listening for file requests
var fileService = require('./webServices/fileService.js');
fileService.StartService(app);

//start listening for node requests, and spin up any node-related processes.
var nodeService = require('./webServices/nodeService.js');
nodeService.StartService(app);

//start the blockService, which pings the mempool at a defined interval and checks for work 
var blockService = require('./webServices/blockService.js');
blockService.StartService(app, isDebug);

//start listening for communications from users via a browser, or from other nodes on the network. 
app.listen(port, () => {
  console.log('Server is up and running on port', port);
});

