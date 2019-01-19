var hash = require('../utilities/hash');


hash.GenerateKeyPair().then((result) => {
    console.log(result.Address);
    console.log(result.PublicKey);
    console.log(result.PrivateKey);
});