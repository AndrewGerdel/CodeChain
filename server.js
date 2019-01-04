const express = require('express');
const bodyParser = require('body-parser');
let memPoolController = require('./controllers/memPoolController.js');
let keyController = require('./controllers/keyController.js');
let blockController = require('./controllers/blockController.js');
let jsonQuery = require('json-query')
const port = process.env.PORT || 65340;

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  Post to /uploadfile to add files.');
});

app.post('/uploadfile', (request, response) => {
  var filename = request.body.filename;
  var fileContents = request.body.filecontents;
  var publicKey = request.body.publickey;
  var privateKey = request.body.privatekey;
  console.log(filename, fileContents, publicKey, privateKey);

  var signedMessage = keyController.SignMessage(fileContents, new Buffer(privateKey, 'hex'));
  memPoolController.AddCodeFileToMemPool(filename, fileContents, signedMessage, publicKey)
    .then((result) => {
      response.send(result);
    })
    .catch((ex) => {
      response.send('exception: ' + ex);
    })
});

app.get('/getfile', (request, response) => {
  blockController.GetFileFromBlock(request.query.filehash)
    .then((block) => {
      if (block.length > 0) {
        var jsonQueryResult = jsonQuery('data[hash=' + request.query.filehash + ']', {
          data: block
        });
        response.send({
          file: jsonQueryResult.value
        });
      } else {
        response.send('File not found');
      }
    }, (error) => {
      console.log(error);
    })
    .catch((ex) => {
      console.log(ex);
    })

});

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
