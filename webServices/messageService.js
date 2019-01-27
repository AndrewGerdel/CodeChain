var hash = require('../utilities/hash.js');
var memPoolController = require('../controllers/memPoolController');
var blockController = require('../controllers/blockController');
var crypto = require('crypto');
var crypto2 = require('crypto2');
let jsonQuery = require('json-query')

var StartService = ((app) => {

    app.post('/message/createRequest', async (request, response) => {
        try {
            var message = request.body.message;
            var recipientPublicKey = request.body.recipientpublickey;
            var senderPrivateKey = request.body.senderprivatekey;
            var salt = crypto.randomBytes(16).toString('hex');

            //encrypt with the recipients public key
            const encrypted = await crypto2.encrypt.rsa(message, recipientPublicKey);

            //sign the message with the senders private key. Prepend the salt so identical messages get different signatures. 
            var signature = await hash.SignMessage(senderPrivateKey, `${salt}${encrypted}`);

            response.send({ Success: true, Signature: signature, Salt: salt, EncryptedMessage: encrypted });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }

    });

    app.post('/message/submitRequest', async (request, response) => {
        try {

            var senderPublicKey = request.body.senderpublickey;
            var recipientPublicKey = request.body.recipientpublickey;
            var signature = request.body.signature;
            var encryptedMessage = request.body.encryptedmessage;
            var salt = request.body.salt;
            var result = await memPoolController.AddMessageToMemPool(senderPublicKey, recipientPublicKey, encryptedMessage, salt, signature);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/message/get', async (request, response) => {
        try {
            var block = await blockController.GetFileFromBlock(request.query.messagehash);
            if (block.length > 0) {
                var jsonQueryResult = jsonQuery('data[hash=' + request.query.messagehash + ']', {
                    data: block
                });
                response.send({ Success: true, PublicKey: jsonQueryResult.value.publicKey, EncryptedMessage: jsonQueryResult.value.messageData.messageText, Signature: jsonQueryResult.value.signature, DateAdded: jsonQueryResult.value.dateAdded, Salt: jsonQueryResult.value.salt, From: jsonQueryResult.value.messageData.from, To: jsonQueryResult.value.messageData.to });
            } else {
                response.send({ Success: false, ErrorMessage: "Message not found" });
            }
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
});

module.exports = {
    StartService
}
