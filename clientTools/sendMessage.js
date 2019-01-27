var request = require('request');
var requestPromise = require('request-promise');
var yargs = require('yargs');
var fs = require('fs');

var nodeEndpoint = "http://127.0.0.1:65340";

if (!yargs.argv.message) {
    console.log('Missing parameter --message.');
    return;
}

if (!yargs.argv.toPublicKey) {
    console.log('Missing parameter --toPublicKey.  Full or relative path to .pem file.');
    return;
}

if (!yargs.argv.fromPublicKey) {
    console.log('Missing parameter --fromPublicKey.  Full or relative path to .pem file.');
    return;
}

if (!yargs.argv.fromPrivateKey) {
    console.log('Missing parameter --fromPrivateKey.  Full or relative path to .aes file.');
    return;
}

var CreateRequest = (async (message, recipientPublicKey, senderPrivateKey) => {
    const data = JSON.stringify({
        message: message,
        recipientpublickey: recipientPublicKey,
        senderprivatekey: senderPrivateKey
    });
    const options = {
        uri: nodeEndpoint + '/message/createRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }
    var body = await requestPromise(options);
    var bodyObj = JSON.parse(body);
    return bodyObj;
});

var SubmitRequest = ((senderPublicKey, recipientPublicKey, signature, encryptedMessage, salt) => {
    const data = JSON.stringify({
        senderpublickey: senderPublicKey,
        recipientpublickey: recipientPublicKey,
        signature: signature,
        encryptedmessage: encryptedMessage,
        salt: salt
    });
    const options = {
        uri: nodeEndpoint + '/message/submitRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            console.log('SubmitResult: ', body);
        }
    });
});

var toPublicKey = fs.readFileSync(yargs.argv.toPublicKey).toString();
var fromPublicKey = fs.readFileSync(yargs.argv.fromPublicKey).toString();
var fromPrivateKey = fs.readFileSync(yargs.argv.fromPrivateKey).toString();

CreateRequest(yargs.argv.message, toPublicKey, fromPrivateKey).then(async (createResult) => {
    await SubmitRequest(fromPublicKey, toPublicKey, createResult.Signature, createResult.EncryptedMessage, createResult.Salt);
});
