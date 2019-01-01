


//
// var keyController = require('./controllers/keyController.js');
// var key = keyController.GenerateKeyPair();
// let message = 'This is my messsage.';
// var signedMessage = keyController.SignMessage(message, key.PrivateKey);
//
// let verified = keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, key.PublicKey);
//
// console.log(`Public Key: ${key.PublicKey.toString("hex")}`);
// console.log(`Private Key: ${key.PrivateKey.toString("hex")}`);
// console.log(`Message: ${message}`);
// console.log(`Digest: ${signedMessage.Digest.toString("hex")}`);
// console.log(`Signed Message: ${signedMessage.Signature.toString("hex")}`);
// console.log(`Verified: ${verified}`);








// var message = keyController.GenerateMessage('somemessage', key.PublicKey, key.PrivateKey);
// console.log('The message is', message);
// var verified = keyController.VerifyMessage(message, key.PublicKey, key.PrivateKey);

// console.log('Final result', verified);

// var memPoolManager = require('./controllers/memPoolController.js');
// var a = memPoolManager.AddCodeFileToMemPool('abc', 'asdf');

// var {Block} = require('./models/block.js');
//
// var block = new Block({
//   blockNumber: 1,
//   previousBlockHash: 'abc',
//   blockHash: 'def'
// });
//
// block.save()
//   .then((res) => {
//     console.log('Done', res);
//   }, (error) => {
//     console.log('Error:', error);
//   })
//   .catch((ex) => {
//     console.log('Exception:', ex);
//   });
