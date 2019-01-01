var assert = require('assert');
var keyController = require('../controllers/keyController.js');

describe('keyController', function() {
  describe('#GenerateAndValidateMessage()', function() {
    it('should generate a keypair', function() {
      var key = keyController.GenerateKeyPair();
      assert((key.PublicKey.toString("hex")).length > 0);
      console.log(`Public key: ${key.PublicKey.toString("hex")}`);
      console.log(`Private key: ${key.PrivateKey.toString("hex")}`);
    });
  });
  describe('#SignMessageTest()', function() {
    it('should sign and verify a message', function() {
      var key = keyController.GenerateKeyPair();
      var signedMessage = keyController.SignMessage('some test message', key.PrivateKey);
      assert((signedMessage.Signature).length > 0, signedMessage.Signature);
      let verified = keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, key.PublicKey);
      assert(verified == true);
    });
  });
  describe('#FailSignedMessageVerificationTest()', function() {
    it('should sign and NOT verify a message', function() {
      var key = keyController.GenerateKeyPair();
      var signedMessage = keyController.SignMessage('some test message', key.PrivateKey);
      assert((signedMessage.Signature).length > 0, signedMessage.Signature);
      var badKey = keyController.GenerateKeyPair(); //generate a NEW key and try to verify against that.  It shouldn't work.
      let verified = keyController.VerifySignedMessage(signedMessage.Digest, signedMessage.Signature, badKey.PublicKey);
      assert(verified == false);
    });
  });
});
