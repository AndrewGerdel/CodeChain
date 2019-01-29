
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
                //This code stolen from generateKeypair.js.  Because I don't see how to setup another readline...
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
                rl.question(`Enter a password for your private key file. If you forget this password or lose this file you will lose all your funds: `, async (password1) => {
                    rl.question(`Enter the password again: `, async (password2) => {
                        if (password1 != password2) {
                            console.log('Passwords do not match.');
                            rl.close();
                            return;
                        } else {
                            rl.close();
                            var cipher = crypto.createCipher('aes-256-cbc', password1);
                            var encrypted = Buffer.concat([cipher.update(new Buffer.from(JSON.stringify(result.PrivateKey), "utf8")), cipher.final()]);
                            fs.writeFileSync(`./keys/${dirName}/private.aes`, encrypted);
                            console.log(`Wrote to keys directory: ${dirName}`);

                            var configObj = {
                                "database": {
                                    "host": dbServer,
                                    "database": databaseName
                                },
                                "network": {
                                    "myPort": port,
                                    "myProtocol": "http",
                                    "myUid": crypto.randomBytes(16).toString('hex')
                                },
                                "mining": {
                                    "publicKey": result.Address
                                }
                            };
                            fs.writeFileSync('config.json', JSON.stringify(configObj));
                            console.log('Setup complete. Created file config.json. Run server.js to start.');
                            rl.close();
                        }
                    });
                });






                // rl.question(`Enter a password for the private key file. If you forget this password or lose this file you will lose all your funds: `, async (password1) => {
                //     rl.question(`Enter the password again: `, async (password2) => {
                //         if (password1 != password2) {
                //             console.log('Passwords do not match.');
                //             rl.close();
                //             return;
                //         } else {
                //             rl.close();
                //             var cipher = crypto.createCipher('aes-256-cbc', password1);
                //             var encrypted = Buffer.concat([cipher.update(new Buffer.from(JSON.stringify(result.PrivateKey), "utf8")), cipher.final()]);
                //             fs.writeFileSync(`./keys/${dirName}/private.aes`, encrypted);
                //             console.log(`Wrote to ${dirName}`);

                //             rl.question(`To what address should your mining block rewards be paid? (${keypair.Address})`, (address) => {
                               
                //             });
                //         }
                //     });
                // });



            });
        });
    });
});

module.exports = {
    CreateConfigFile
}