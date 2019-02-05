var decryptFile = require('../utilities/decryptFile');
var yargs = require('yargs');

if (!yargs.argv.path) {
    console.log('Missing parameter --path.');
    return;
}



decryptFile.DecryptFile(yargs.argv.path, (result) => {
    console.log(result);
});