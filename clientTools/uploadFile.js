//Simple but functional proof of concept to submit a file to the CodeChain Network.
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');
var decryptFile = require('../utilities/decryptFile');

var nodeEndpoint = "http://127.0.0.1:65340"

var file = yargs.argv.file;
if (!file) {
    console.log("Missing --file parameter.  Provide path of file to upload.");
    return;
}
var public = yargs.argv.public;
if (!public) {
    console.log("Missing --public parameter. Provide path of public key file.");
    return;
}
var private = yargs.argv.private;
if (!private) {
    console.log("Missing --private parameter.  Provide path of private key file.");
    return;
}
var endpoint = yargs.argv.endpoint;
if (endpoint)
    nodeEndpoint = endpoint;

if (!fs.existsSync(file))
    throw new Error(`${file} does not exist`);
if (!fs.existsSync(public))
    throw new Error(`${public} does not exist`);
if (!fs.existsSync(private))
    throw new Error(`${private} does not exist`);

var filename = path.basename(file);
var filecontents = fs.readFileSync(file);
var publickey = fs.readFileSync(public);

decryptFile.DecryptFile(private, (decryptResult) => {
    if(decryptResult.Success){
        var privatekey = decryptResult.DecryptedResult;// fs.readFileSync(private).toString();

        var uploadFile = require('../utilities/uploadFile');

        uploadFile.UploadFile(nodeEndpoint, filename, filecontents, publickey, privatekey).then((result) => {
            console.log(result);
        }).catch((ex) => {
            console.log('Error: ', ex);
        });
    }else{
        console.log("Could not decrypt private key file. Error: ", decryptResult.ErrorMessage);
        
    }
    
    
});
