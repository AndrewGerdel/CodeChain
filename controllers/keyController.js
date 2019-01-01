const crypto = require('crypto');
const secp256k1 = require('secp256k1');

var GenerateKeyPair = (() => {
  let privateKey;
  do {
    privateKey = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));
  const publicKey = secp256k1.publicKeyCreate(privateKey);
  return { PrivateKey: privateKey, PublicKey: publicKey};
});


var SignMessage = ((message, privateKey) => {
  let digested = digest(message);
  let sigObj = secp256k1.sign(digested, privateKey);
  return { Signature:  sigObj.signature, Digest: digested };
});

var VerifySignedMessage = ((digest, signature, publicKey) => {
  let verified = secp256k1.verify(digest, signature, publicKey);
  return verified;
});


function digest(str, algo = "sha256") {
  return crypto.createHash(algo).update(str).digest();
}

module.exports ={
  GenerateKeyPair:GenerateKeyPair,
  SignMessage:SignMessage,
  VerifySignedMessage:VerifySignedMessage
}
