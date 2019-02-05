var readline = require('readline');
var crypto = require('crypto');
var fs = require('fs');
var readline = require('readline');

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
            callback({Success: true, DecryptedResult: decryptedResult});
        } catch (ex) {
            callback({Success: false, ErrorMessage: ex});
        } finally {
            rl.close();
        }
    });
});

module.exports = {
    DecryptFile
}