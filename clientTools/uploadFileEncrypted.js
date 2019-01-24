//Simple but functional proof of concept to submit a file to the CodeChain Network.
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');

var nodeEndpoint = "http://127.0.0.1:65340/file/createSubmitRequestEncrypted"

var file = yargs.argv.file;
if (!file) {
    console.log("Missing --file parameter.  Provide path of file to upload.");
    return;
}
var public = yargs.argv.public;
if (!public){
    console.log("Missing --public parameter. Provide path of public key file.");
    return;
}
var private = yargs.argv.private;
if (!private){
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
var publickey = fs.readFileSync(public).toString();
var privatekey = fs.readFileSync(private).toString();

const data = JSON.stringify({
    filename: filename,
    filecontents: filecontents,
    publickey: publickey,
    privatekey: privatekey
});
console.log('url is', nodeEndpoint);

const options = {
    uri: nodeEndpoint,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    body: data
}

request(options, (err, res, body) => {
    if (err) {
        console.log(':', err);
    } else {
        console.log(body);
    }
});


