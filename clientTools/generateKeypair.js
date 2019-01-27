var hash = require('../utilities/hash');
var fs = require('fs');
var readline = require('readline');
var crypto = require('crypto');

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


    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await rl.question(`Enter a password for the private key file. If you forget this password or lose this file you will lose all your funds: `, async (password1) => {
        await rl.question(`Enter the password again: `, async (password2) => {
            if (password1 != password2) {
                console.log('Passwords do not match.');
                rl.close();
                return;
            } else {
                rl.close();
                var cipher = crypto.createCipher('aes-256-cbc', password1);
                var encrypted = Buffer.concat([cipher.update(new Buffer.from(JSON.stringify(result.PrivateKey), "utf8")), cipher.final()]);
                fs.writeFileSync(`./keys/${dirName}/private.aes`, encrypted);
                console.log(`Wrote to ${dirName}`);
            }
        });
    });
});

module.exports = {
    GenerateAndSaveKeyPair
}

