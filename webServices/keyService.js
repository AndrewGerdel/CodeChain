var hash = require('../utilities/hash.js');
var StartService = ((app) => {

    app.get('/keys/get', async (request, response) => {
        var keypair = await hash.GenerateKeyPair();
        response.send(keypair);
        // response.send({ PublicKey: keypair.publicKey, PrivateKey: keypair.privateKey })
    });

});

module.exports = {
    StartService
}
