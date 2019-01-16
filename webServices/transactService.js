let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let crypto = require('crypto');


var StartService = ((app) => {

    //create a signed transaction. Should be done from secure (preferably air-gapped) node as it requires the private key
    app.post('/transact/createRequest', async (request, response) => {
        try {
            var from = request.body.from;
            var to = request.body.to;
            var amount = request.body.amount;
            var privateKey = request.body.privatekey;
            var salt = crypto.randomBytes(16).toString('hex');
            console.log(`Generating signed transaction for: ${from} sending ${amount} to ${to}.`);

            let buff = new Buffer.from(`${from}${amount}${to}${salt}`);
            let base64data = buff.toString('base64');
            var signedMessage = await hash.SignMessage(privateKey, base64data);
            response.send({ Success: true, Signature: signedMessage, Salt: salt });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //submit a signed transaction.  Should be done from online node
    app.post('/transact/submitRequest', async (request, response) => {
        try {
            var from = request.body.from;
            var to = request.body.to;
            var amount = request.body.amount;
            var publicKey = request.body.publickey;
            var signedMessage = request.body.signedmessage;
            var salt = request.body.salt;
            var result = await memPoolController.AddTransactionToMemPool(from, to, amount, salt, signedMessage, publicKey);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

});

module.exports = {
    StartService
}