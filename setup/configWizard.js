
var CreateConfigFile = (async () => {
    const readline = require('readline');
    var generateKey = require('../clientTools/generateKeypair');
    var fs = require('fs');
    var crypto = require('crypto');
    var hash = require('../utilities/hash');

    console.log('Answer the following questions.  These values can always be changed in the config.json file later.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('What is your database server? (mongodb://localhost:27017/): ', (dbServer) => {
        if (!dbServer || dbServer.length == 0) {
            dbServer = 'mongodb://localhost:27017/';
        }
        rl.question('What would you like to name the database? (CodeChain) ', (databaseName) => {
            if (!databaseName || databaseName.length == 0) {
                databaseName = 'CodeChain';
            }
            rl.question('On which port should we listen for incoming connections? Must be accessible from the internet. (65340) ', async (port) => {
                if (!port || port.length == 0) {
                    port = '65340';
                }
                  rl.question(`Enter a password for the private key file. If you forget this password or lose this file you will lose all your funds: `, async (password1) => {
                    rl.question(`Enter the password again: `, async (password2) => {
                        if (password1 != password2) {
                            console.log('Passwords do not match.');
                            rl.close();
                            return;
                        } else {
                            var result = await generateKey.GenerateKeyPair(password1);
                        }
                    });
                });
            });
        });
    });
});

module.exports = {
    CreateConfigFile
}