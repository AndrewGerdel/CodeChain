const express = require('express');
const bodyParser = require('body-parser');
let blockController = require('./controllers/blockController.js');
const port = process.env.PORT || 65340;

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  Post to /uploadfile to add files.');
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
