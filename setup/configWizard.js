
var CreateConfigFile = (async () => {
    const readline = require('readline');
    var generateKey = require('../clientTools/generateKeypair');
    var fs = require('fs');
    var crypto = require('crypto');

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
                debugger;
                var keypair = await generateKey.GenerateAndSaveKeyPair();
                rl.question(`To what address should your mining block rewards be paid? (${keypair.Address})`, (address) => {
                    if (!address || address.length == 0) {
                        address = keypair.Address;
                    }
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
                            "publicKey": address
                          }
                    };
                    fs.writeFileSync('config.json', JSON.stringify(configObj));
                    console.log('Setup complete. Created file config.json. Run server.js to start.');
                    rl.close();
                });
            });
        });
    });
});

module.exports = {
    CreateConfigFile
}