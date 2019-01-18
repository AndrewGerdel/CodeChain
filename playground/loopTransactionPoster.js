var request = require('request');
var hash = require('../utilities/hash');

var testAddresses = require('../playground/testAddresses');

var CreateRequest = (async (callback) => {
    var nodeEndpoint = 'http://localhost:65340/transact/createRequest';
    console.log('Endpoint is', nodeEndpoint);
    const data = JSON.stringify({
        from: testAddresses.Timmy().Address,
        to: testAddresses.Tommy().Address,
        amount: 2,
        privatekey: testAddresses.Timmy().PrivateKey
    });
    const options = {
        uri: nodeEndpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            // console.log(body);
            callback(body);
        }
    });

});

var SubmitRequest = (async (createRequestResults, callback) => {
    var nodeEndpoint = 'http://localhost:65340/transact/submitRequest';
    console.log('Endpoint is', nodeEndpoint);
    const data = JSON.stringify({
        from: testAddresses.Timmy().Address,
        to: testAddresses.Tommy().Address,
        amount: 2,
        publickey: testAddresses.Timmy().PublicKey,
        signedmessage: createRequestResults.Signature,
        salt: createRequestResults.Salt,
    });

    
    const options = {
        uri: nodeEndpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            //console.log(body);
            callback(body);
        }
    });

});

var loopTransactionPost = (() => {

    CreateRequest((createResponse) => {
        var response = JSON.parse(createResponse);
        // console.log('create response sig is', response.Signature);
        SubmitRequest(response, (res) => {
            try {

                var submitResponse = JSON.parse(res);
                if (submitResponse.Success == true) {
                    console.log(`Success.  Hash ${submitResponse.Hash}`);
                } else {
                    console.log(`Failure.  Error ${submitResponse.ErrorMessage}`);
                }
            } finally {
                setTimeout(function () {
                    loopTransactionPost();
                }, 30000);
            }

        });
    });
});

loopTransactionPost();
