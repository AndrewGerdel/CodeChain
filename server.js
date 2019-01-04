const express = require('express');
const bodyParser = require('body-parser');
let blockController = require('./controllers/blockController.js');
var argv = require('yargs').argv;
let port = 65340;
if(argv.p){
  port = argv.p;
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, reason);
});

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  POST to /uploadfile to add files. GET to /getfiles to retrieve a file by hash.');
});

//start listening for file requests
var fileService = require('./services/fileService.js');
fileService.StartService(app);

//start listening for node requests, and spin up any node-related processes.
var nodeService = require('./services/nodeService.js');
nodeService.StartService(app);

app.listen(port, () => {
  console.log('Server is up and running on port', port);
});

//Every 2 seconds, look for more data to mine.
setInterval(Timer_MineNextBlock, 2000);
function Timer_MineNextBlock() {
  console.log('Checking mempool...');
  blockController.MineNextBlock();
}
