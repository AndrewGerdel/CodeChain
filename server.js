const express = require('express');
const bodyParser = require('body-parser');
let memPoolController = require('./controllers/memPoolController.js');
let keyController = require('./controllers/keyController.js');
let blockController = require('./controllers/blockController.js');

const port = process.env.PORT || 65340;

var app = express();
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the blockchain.  Post to /uploadfile to add files.');
});

app.post('/uploadfile',function(request,response){
  var filename=request.body.filename;
  var fileContents=request.body.filecontents;
  var publicKey=request.body.publickey;
  var privateKey=request.body.privatekey;
  console.log(filename, fileContents, publicKey, privateKey);

  var signedMessage = keyController.SignMessage(fileContents, new Buffer(privateKey, 'hex'));
  memPoolController.AddCodeFileToMemPool(filename, fileContents, signedMessage, publicKey)
    .then((result) => {
      debugger;
      response.send(result);
    })
    .catch((ex) => {
      response.send('exception: ' + ex);
    })
});

app.listen(port, () => {
  console.log('Server is up and running on port', port);
});


setInterval(abc, 5000);

function abc() {
  blockController.MineNextBlock();
}
