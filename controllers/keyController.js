const crypto = require('crypto');
const secp256k1 = require('secp256k1');
var conv = require('binstring');
let mongoose = require('../db/mongoose.js');

//Generates a new key pair
var GenerateKeyPair = (() => {
  let privateKey;
  do {
    privateKey = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));
  const publicKey = secp256k1.publicKeyCreate(privateKey);
  return { PrivateKey: privateKey, PublicKey: publicKey};
});

//Signs the supplied message with the supplied private key
var SignMessage = ((message, privateKey) => {
  let digested = digest(message);
  let sigObj = secp256k1.sign(digested, privateKey);
  return { Signature:  sigObj.signature, Digest: digested };
});

//Verifies a signed message was created by the private key associated with the public key.
var VerifySignedMessage = ((digest, signature, publicKey) => {
  let verified = secp256k1.verify(digest, signature, publicKey);
  return verified;
});

//Hashes the supplied string, default sha256
function digest(str, algo = "sha256") {
  return crypto.createHash(algo).update(str).digest();
}

module.exports ={
  GenerateKeyPair:GenerateKeyPair,
  SignMessage:SignMessage,
  VerifySignedMessage:VerifySignedMessage,
}
