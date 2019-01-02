var assert = require('assert');
var keyController = require('../controllers/keyController.js');
var memPoolController = require('../controllers/memPoolController.js');

describe('memPoolController', function() {
  describe('#AddCodeFileToMemPool()', function() {
    it('match a base64 version of the string and verify the signature', function() {
      let fileContents = 'console.writeline("hello world");'
      var key = keyController.GenerateKeyPair();
      var signedMessage = keyController.SignMessage(fileContents, key.PrivateKey);
      //console.log(signedMessage.Signature.toString("hex"));
      // var AddCodeFileToMemPool = ((fileName, fileContents, signedMessage, publicKey) => {
      memPoolController.AddCodeFileToMemPool("Myfile.txt", fileContents, signedMessage, key.PublicKey.toString("hex"))
        .then(
          (result) => {
            assert.equal(result, 'Y29uc29sZS53cml0ZWxpbmUoImhlbGxvIHdvcmxkIik7', result);
            let verified = keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, key.PublicKey);
            assert.equal(verified, true);
          }, (error) => {
            console.log(error);
          })
        .catch((ex) => {console.log(ex);})

    });
  });
});
