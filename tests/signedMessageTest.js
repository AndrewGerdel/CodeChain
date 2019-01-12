const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const hashUtil = require('../utilities/hash.js');

var Test2 = () => {
  var signedMessage = "06c55cf86e2da232af8ee90cee4f9e1cb71f6dc4dc2305cb9d7bfa42cbce5bca76285c7d1c37c384253b463e0896bd81a7fcf6813cb8832d7dcfa736ca77acb3";
  var pubKeyAsString = "0367220b4576f3704efd291208fd38c8199be1d6a821c92eca69d2138849a8e13f";
  var fileContents = "c29tZWNvbnRlbnQ=";

  // let verified = secp256k1.verify(new Buffer.from(digest), new Buffer.from(signature), new Buffer.from(publicKey));
   var a = hashUtil.VerifySignedMessage(fileContents, signedMessage, pubKeyAsString);
  // var a = secp256k1.verify(new Buffer.from(msgAsString.toString('hex'), 'hex'), new Buffer.from(signatureAsString, 'hex'), new Buffer.from(pubKeyAsString, 'hex'));
console.log(a);

};

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