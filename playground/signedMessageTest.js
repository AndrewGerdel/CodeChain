const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const hashUtil = require('../utilities/hash.js');
const testAddresses = require('./testAddresses');

var Test1 = (async () => {

  const msg = "Hi there Andrew";// randomBytes(32); //msg is a sha256 hash string.
  //  console.log(msg.toString("hex"));

  // generate privKey
  // let privKey
  // do {
  //   privKey = randomBytes(32)
  // } while (!secp256k1.privateKeyVerify(privKey))

  let privKey = testAddresses.Timmy().PrivateKey;

  // // get the public key in a compressed format
  // const pubKey = secp256k1.publicKeyCreate(privKey)

  let pubKey = testAddresses.Timmy().PublicKey;
  var signature = await hashUtil.SignMessage(privKey, msg);
  var verified = await hashUtil.VerifyMessage(pubKey, signature, msg);
  // sign the message
  // let buf = new Buffer.from(privKey);
  // const sigObj = secp256k1.sign(msg, buf);



  // var signatureAsString = sigObj.signature.toString('hex');
  // var pubKeyAsString = pubKey.toString('hex');
  // var msgAsString = msg.toString('hex');

  // console.log('signatureAsString:', signatureAsString);
  // console.log('pubKeyAsString:', pubKeyAsString);
  // console.log('msgAsString:', msgAsString);

  // // verify the signature
  // console.log(secp256k1.verify(new Buffer.from(msgAsString, 'hex'), new Buffer.from(signatureAsString, 'hex'), new Buffer.from(pubKeyAsString, 'hex')));

});

Test2();