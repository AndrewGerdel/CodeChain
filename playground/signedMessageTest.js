const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const hashUtil = require('../utilities/hash.js');


var Test1 = (() => {

  const msg = randomBytes(32); //msg is a sha256 hash string.
  //  console.log(msg.toString("hex"));

  // generate privKey
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  // get the public key in a compressed format
  const pubKey = secp256k1.publicKeyCreate(privKey)

  // sign the message
  const sigObj = secp256k1.sign(msg, privKey)

  var signatureAsString = sigObj.signature.toString('hex');
  var pubKeyAsString = pubKey.toString('hex');
  var msgAsString = msg.toString('hex');

  console.log('signatureAsString:', signatureAsString);
  console.log('pubKeyAsString:', pubKeyAsString);
  console.log('msgAsString:', msgAsString);
  
  // verify the signature
  console.log(secp256k1.verify(new Buffer.from(msgAsString, 'hex'), new Buffer.from(signatureAsString, 'hex'), new Buffer.from(pubKeyAsString, 'hex')));

});


// Test1();
Test2();