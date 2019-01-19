var testAddress = require('../testAddresses');
var request = require('request');
var yargs = require('yargs');

var CreateAndSubmitTransaction = (async () => {
    var amount = yargs.argv.amount;
    if (!amount) {
        console.log('Missing --amount parameter.');
        return;
    }

    var from = testAddress.Timmy();
    var to = testAddress.Tommy();

    GetBalance(from.Address, (fromBalance) => {
        console.log(`${from.Name} balance is: `, fromBalance);
        GetBalance(to.Address, (toBalance) => {
            console.log(`${to.Name} balance is: `, toBalance);
            CreateRequest(from.Address, to.Address, amount, from.PrivateKey, (resultBody) => {
                var bodyObj = JSON.parse(resultBody);
                if (bodyObj.Success == true) {
                    SubmitRequest(from.Address, to.Address, amount, from.PublicKey,
                        bodyObj.Signature, bodyObj.Salt, (submitResponse) => {
                            console.log(submitResponse);
                        });
                } else {
                    console.log('CreateRequest failed. ', bodyObj.ErrorMessage);
                }
            });
        });
    });
});


var SubmitRequest = (async (from, to, amount, publickey, signature, salt, callback) => {
    var nodeEndpoint = 'http://localhost:65340/transact/submitRequest';
    const data = JSON.stringify({
        from: from,
        to: to,
        amount: amount,
        publickey: publickey,
        signedmessage: signature,
        salt: salt
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
            console.log('!!!!!!!!!!!!!!!! FAILURE SUBMITING REQUEST:', err);
        } else {
            callback(body);
        }
    });

});

var CreateRequest = (async (from, to, amount, privateKey, callback) => {
    var nodeEndpoint = 'http://localhost:65340/transact/createRequest';
    const data = JSON.stringify({
        from: from,
        to: to,
        amount: amount,
        privatekey: privateKey
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
            console.log('!!!!!!!!!!!!!!!! FAILURE CREATING REQUEST:', err);
        } else {
            callback(body);
        }
    });

});

var GetBalance = (async (address, callback) => {
    var options = {
        url: 'http://localhost:65340/transact/getBalance?address=' + address,
        method: 'GET',
    };
    await request(options, (err, res, body) => {
        var bodyObj = JSON.parse(body);
        callback(bodyObj.Balance);
    });
});

CreateAndSubmitTransaction();