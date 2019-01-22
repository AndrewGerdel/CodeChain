var hash = require('../utilities/hash');
var fs = require('fs');

hash.GenerateKeyPair().then((result) => {

    var dirName = result.Address.substr(0, 3) + result.Address.substr(61, 3);

    fs.mkdirSync(`./keys/${dirName}`);
    fs.writeFile(`./keys/${dirName}/address.txt`, `${result.Address}`, (err) => {
        if (err) {
            console.log('Error savig address: ', err);
        }
    });
    fs.writeFile(`./keys/${dirName}/public.pem`, `${result.PublicKey}`, (err) => {
        if (err) {
            console.log('Error savig public: ', err);
        }
    });
    fs.writeFile(`./keys/${dirName}/private.pem`, `${result.PrivateKey}`, (err) => {
        if (err) {
            console.log('Error savig private: ', err);
        }
    });

    console.log(`Generated ${result.Address} in ./keys/${dirName}`);

});