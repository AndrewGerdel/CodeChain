let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query');


var StartService = ((app) => {

    //create a signed transaction. Should be done from secure (preferably air-gapped) node as it requires the private key
    app.post('/transact/create', async (request, response) => {
        try {
            var from = request.body.from;
            var to = request.body.to;
            var amount = request.body.amount;
            var privateKey = request.body.privatekey;
            console.log(`Received transaction: ${from} sending ${amount} to ${to}.`);

            let buff = new Buffer.from(`${from}${amount}${to}`);
            let base64data = buff.toString('base64');
            var signedMessage = await hash.SignMessage(privateKey, base64data);
            response.send({ Success: true, SignedMessasge: signedMessage });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //submit a signed transaction.  Should be done from online node
    app.post('/transact/submit', async (request, response) => {
        try {
            var from = request.body.from;
            var to = request.body.to;
            var amount = request.body.amount;
            var publicKey = request.body.publickey;
            var signedMessage = request.body.signedmessage;
            var result = await memPoolController.AddTransactionToMemPool(from, to, amount, signedMessage, publicKey);
            response.send({ Success: true, Result: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

});

module.exports = {
    StartService
}