var genKeyPair = require('../utilities/generateKeypair');
var StartService = ((app) => {

    app.get('/keys/get', async (request, response) => {
        var keypair = await genKeyPair.GenerateKeyPair();
         response.send({Note: "The keys below contain escaped newline characters that should be replaced with new lines. Consider using clientTools/generateKeypair.", 
            Address: keypair.Address, PublicKey: keypair.PublicKey, PrivateKey: keypair.PrivateKey });
    });
});

module.exports = {
    StartService
}
