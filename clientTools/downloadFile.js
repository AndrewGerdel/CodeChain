//Simple but functional proof of concept to download a file from the CodeChain Network.
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');

var nodeEndpoint = "http://127.0.0.1:65340/file/get";
var destination = "c:\\FakeRepo\\";

if (!yargs.argv.filehash) {
    console.log('Missing parameter --filehash.');
    return;
}

request(nodeEndpoint + '?filehash=' + yargs.argv.filehash, (err, res, body) => {
    if (err) {
        console.log('ERROR :', err);
    } else {
        //console.log(body);
        var bodyObj = JSON.parse(body);
        //console.log(bodyObj.FileContents);
        let buff = new Buffer.from(bodyObj.FileContents, 'base64');
        // let text = buff.toString('ascii');
        var saveToFilePath = destination + bodyObj.FileName;
        if (fs.existsSync(saveToFilePath)) {
            console.log('File already exists. Will not overwrite ', saveToFilePath);
            return;
        }
        fs.writeFile(saveToFilePath, buff, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved to ", saveToFilePath);
        });

    }
});
