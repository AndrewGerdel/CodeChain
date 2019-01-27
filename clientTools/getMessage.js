//Simple but functional proof of concept to download a message from the CodeChain Network.
var request = require('request');
var fs = require('fs');
var yargs = require('yargs');
var crypto2 = require('crypto2');
var hash = require('../utilities/hash');

var nodeEndpoint = "http://127.0.0.1:65340/message/get";
var destination = "c:\\FakeRepo\\";

if (!yargs.argv.messagehash) {
    console.log('Missing parameter --messagehash.');
    return;
}

if (!yargs.argv.privatekey) {
    console.log('Missing parameter --privatekey.  Path to private key .pem file.');
    return;
}

request(nodeEndpoint + '?messagehash=' + yargs.argv.messagehash, async (err, res, body) => {
    if (err) {
        console.log('ERROR :', err);
    } else {
        //console.log(body);
        var bodyObj = JSON.parse(body);
        var privateKey = fs.readFileSync(yargs.argv.privatekey);
        if (bodyObj.Success == true) {
            var verified = await hash.VerifyMessage(bodyObj.PublicKey, bodyObj.Signature, `${bodyObj.Salt}${bodyObj.EncryptedMessage}`);
            if (verified == true) {
                console.log('Message verified successfully.  Message contents:');
                const decrypted = await crypto2.decrypt.rsa(bodyObj.EncryptedMessage, privateKey);
                console.log(decrypted);
            }else{
                console.log('Failed to verify message');
            }

        } else {
            console.log(bodyObj.ErrorMessage);
        }
    }
});
