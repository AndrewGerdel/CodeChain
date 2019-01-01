let memPoolController = require('./controllers/memPoolController.js');
 let keyController = require('./controllers/keyController.js');
 let {mongoose} = require('./db/mongoose.js');

let publicKey = "0367220b4576f3704efd291208fd38c8199be1d6a821c92eca69d2138849a8e13f";
let privateKey = "a39911ddae60ab1d0be2cace99bf7f9a1b7fc2e3bdb45b76ffbfbd5a91c48745";
let fileContents = "These contents were created at " + new Date();

var signedMessage = keyController.SignMessage(fileContents, new Buffer(privateKey, 'hex'));
var memPool = memPoolController.AddCodeFileToMemPool(fileContents, signedMessage.Signature, publicKey, privateKey);

memPoolController.GetMemPoolItems().then((result) => console.log(result.length));
 
