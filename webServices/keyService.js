var hash = require('../utilities/hash.js');
var StartService = ((app) => {

    app.get('/keys/get', async (request, response) => {
        var keypair = await hash.GenerateKeyPair();
        var address = await hash.CreateSha256Hash(keypair.publicKey);
         response.send({Note: "The keys below contain escaped newline characters that should be replaced with new lines.", Address: address.toString('hex'), PublicKey: keypair.publicKey, PrivateKey: keypair.privateKey });
    });

});

module.exports = {
    StartService
}
