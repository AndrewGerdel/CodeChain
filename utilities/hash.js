var crypto = require('crypto');

var CreateSha256Hash = (async (input) => {
  var hash = await crypto.createHash("sha256").update(input.trim()).digest();
  return hash
});

/**
 * @param {privateKey} hex string
 * @param {message} plain text message
 * Returns a hex string
 */
var SignMessage = (async (privateKey, message) => {
  const signer = crypto.createSign('sha256');
  signer.update(message);
  signer.end();

  const signature = signer.sign(privateKey);
  const signature_hex = signature.toString('hex');
  return signature_hex;
});

var VerifyMessage = (async (publicKey, signatureHex, message) => {
  const verifier = crypto.createVerify('sha256');
  verifier.update(message);
  verifier.end();

  const verified = verifier.verify(publicKey, Buffer.from(signatureHex, 'hex'));
  return verified;
});

var GenerateKeyPair = (async () => {
  var keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  var address = await CreateSha256Hash(keyPair.publicKey);
  return { Address: address.toString('hex'), PublicKey: keyPair.publicKey, PrivateKey: keyPair.privateKey };

});


module.exports = {
  CreateSha256Hash,
  SignMessage,
  VerifyMessage,
  GenerateKeyPair
}