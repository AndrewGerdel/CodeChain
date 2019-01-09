var crypto = require('crypto');

function CreateSha256Hash(input) {
  return crypto.createHash("sha256").update(input).digest();
}

function VerifySignedMessage(msg, signature, publicKey) {
  return secp256k1.verify(new Buffer.from(msg, 'hex'), new Buffer.from(signature, 'hex'), new Buffer.from(publicKey, 'hex'));
}

module.exports = {
  CreateSha256Hash
}