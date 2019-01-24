var hash = require('../utilities/hash.js');
var memPoolController = require('../controllers/memPoolController');
var crypto = require('crypto');
var crypto2 = require('crypto2');

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
            debugger;
            var result = memPoolController.AddMessageToMemPool(senderPublicKey, recipientPublicKey, encryptedMessage, salt, signature);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }

    });


    app.post('/message/send', async (request, response) => {
        var message = request.body.message;
        var recipientPublicKey = request.body.recipientpublickey;
        var senderPublicKey = request.body.senderpublickey;
        var senderPrivateKey = request.body.senderprivatekey;
        var salt = crypto.randomBytes(16).toString('hex');

        //encrypt with the recipients public key
        const encrypted = await crypto2.encrypt.rsa(message, recipientPublicKey);

        //sign the message with the senders private key.
        var signature = await hash.SignMessage(senderPrivateKey, `${salt}${encrypted}`);

        var result = await memPoolController.AddCodeFileToMemPool(filename, salt, encrypted, signature, publicKey, repo);
        response.send({ Success: true, Hash: result.hash });

    });

});

module.exports = {
    StartService
}
