var hash = require('../utilities/hash');
var fs = require('fs');

var GenerateAndSaveKeyPair = (async () => {
    var result = await hash.GenerateKeyPair();
    var dirName = result.Address.substr(0, 3) + result.Address.substr(61, 3);
    fs.mkdirSync(`./keys/${dirName}`, { recursive: true });
    fs.writeFile(`./keys/${dirName}/address.txt`, `${result.Address}`, (err) => {
        if (err) {
            console.log('Error saving address: ', err);
        }
    });
    fs.writeFile(`./keys/${dirName}/public.pem`, `${result.PublicKey}`, (err) => {
        if (err) {
            console.log('Error saving public: ', err);
        }
    });
    fs.writeFile(`./keys/${dirName}/private.pem`, `${result.PrivateKey}`, (err) => {
        if (err) {
            console.log('Error saving private: ', err);
        }
    });
    console.log(`Generated ${result.Address} in ./keys/${dirName}`);
    return result;
});


module.exports = {
    GenerateAndSaveKeyPair
}