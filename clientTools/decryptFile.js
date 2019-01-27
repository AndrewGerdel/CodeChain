var readline = require('readline');
var crypto = require('crypto');
var fs = require('fs');
var yargs = require('yargs');
var readline = require('readline');

if (!yargs.argv.path) {
    console.log('Missing parameter --path.');
    return;
}

var DecryptFile = (async (filePath, callback) => {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await rl.question(`Enter the password: `, async (password) => {
        try {
            var data = fs.readFileSync(filePath);
            var decipher = crypto.createDecipher("aes-256-cbc", password);
            var decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
            var os = require('os');
            var decryptedResult = decrypted.toString().replace(/\\n/g, os.EOL).replace(/["']/g, '').trim();
            callback(decryptedResult);
        } catch (ex) {
            callback(ex);
        } finally {
            rl.close();
        }
    });
});

module.exports = {
    DecryptFile
}

DecryptFile(yargs.argv.path, (result) => {
    console.log(result);
});