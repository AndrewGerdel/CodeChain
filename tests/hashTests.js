var assert = require('assert');
var hash = require('../utilities/hash');

describe('hashTest', function() {
  describe('#SignAndVerifyMessage()', function() {
    it('should sign and verify a message', async function() {
        var keypair = await hash.GenerateKeyPair();
        var message = "This is my message";
        var signedMessage = await hash.SignMessage(keypair.PrivateKey, message);
        var verified = await hash.VerifyMessage(keypair.PublicKey, signedMessage);
        assert(verified);
    });
  })
});