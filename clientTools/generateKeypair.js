var readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`Enter a password for the private key file. If you forget this password or lose this file you will lose all your funds: `, async (password1) => {
    rl.question(`Enter the password again: `, async (password2) => {
        rl.close();
        if (password1 != password2) {
            console.log('Passwords do not match.');
            return;
        } else {
            var genKeypair = require('../utilities/generateKeypair');
            genKeypair.GenerateAndSaveKeyPair(password1);

        }
    });
});