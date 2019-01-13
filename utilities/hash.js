var crypto = require('crypto');
const secp256k1 = require('secp256k1');

var CreateSha256Hash = (async(input) => {
  var hash = await crypto.createHash("sha256").update(input).digest();
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

var GenerateKeyPair = (() => {
  var promise = new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) {
        reject('Failed to generate kepair:' + err);
      } else {
        resolve({ PublicKey: publicKey, PrivateKey: privateKey });
      }
    });
  });
  return promise;
});

var TestThis = (async () => {
  var keypair = await GenerateKeyPair();
  var message = "This is my message";
  var signedMessage = await SignMessage(keypair.PrivateKey, message);
  var verified = await VerifyMessage(keypair.PublicKey, signedMessage, message);
  var publicKeyHash = await CreateSha256Hash(keypair.PublicKey);
  var privateKeyHash = await CreateSha256Hash(keypair.PrivateKey);
  
  console.log('PublicKey is ',  keypair.PublicKey);
  console.log('PrivateKey is ', keypair.PrivateKey);
  
  console.log('PublicKey is hash ',  publicKeyHash.toString('hex'));
  console.log('PrivateKey is ', privateKeyHash.toString('hex'));
  console.log(`verified is ${verified}`);
});

//  TestThis();

module.exports = {
  CreateSha256Hash,
  SignMessage,
  VerifyMessage,
  GenerateKeyPair
}