var crypto = require('crypto');

function CreateSha256Hash(input) {
    return crypto.createHash("sha256").update(input).digest();
  }

  module.exports = {
    CreateSha256Hash
  }