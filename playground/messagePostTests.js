var request = require('request');
var testAddresses = require('./testAddresses.js');
var requestPromise = require('request-promise');


var CreateRequest = (async (message, recipientPublicKey, senderPrivateKey) => {
    const data = JSON.stringify({
        message: message,
        recipientpublickey: recipientPublicKey,
        senderprivatekey: senderPrivateKey
    });
    const options = {
        uri: 'http://localhost:65340/message/createRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }
    var body = await requestPromise(options);
    var bodyObj = JSON.parse(body);
    return bodyObj;

    // (err, res, body) => {
    // if (err) {
    //     console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
    // } else {
    //     var bodyObj = JSON.parse(body);
    //     return bodyObj;
    //     // console.log('body is', bodyObj);
    //     // SubmitRequest(path.basename(file), filecontents, bodyObj.Signature, bodyObj.Salt, testAddresses.Timmy().PublicKey, repo);
    // }
    // });
});

var SubmitRequest = ((senderPublicKey, recipientPublicKey, signature, encryptedMessage, salt) => {
    debugger;
    const data = JSON.stringify({
        senderpublickey: senderPublicKey,
        recipientpublickey: recipientPublicKey,
        signature: signature,
        encryptedmessage: encryptedMessage,
        salt: salt
    });
    const options = {
        uri: 'http://localhost:65340/message/submitRequest',
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



CreateRequest('Have a good day', testAddresses.Timmy().PublicKey, testAddresses.Tommy().PrivateKey).then(async (createResult) => {
    // console.log('Here is the result: ' + createResult.Signature);
    await SubmitRequest(testAddresses.Tommy().PublicKey, testAddresses.Timmy().PublicKey, createResult.Signature, createResult.EncryptedMessage, createResult.Salt);
});
