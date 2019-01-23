//Simple but functional proof of concept to download a file from the CodeChain Network.
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');
var hash = require('../utilities/hash');

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
        if (!bodyObj.Success) {
            console.log(bodyObj.ErrorMessage);
            return;
        }
        //Before saving the file, re-hash the filename, contents, signature and salt.  If that doesn't produce the same hash that we requested, 
        //then the node must have tried changing the file contents (or name or signature or salt.)  The file is no longer safe.  This will result
        //in the node that we downloaded this from being blacklisted from the network until they restore the original contents of the file. 
        hash.CreateSha256Hash(`${bodyObj.FileName}${bodyObj.FileContents}${bodyObj.Signature}${bodyObj.Salt}`).then((hashResult) => {
            // console.log(`${bodyObj.FileName}${bodyObj.FileContents}${bodyObj.Signature}${bodyObj.Salt} created hash ${hashResult.toString('hex')}`);
            if (hashResult.toString('hex') == yargs.argv.filehash) {
                //console.log(bodyObj.FileContents);
                let buff = new Buffer.from(bodyObj.FileContents, 'base64');
                // let text = buff.toString('ascii');
                var saveToFilePath = destination + bodyObj.FileName;

                //up to each developer.  If you want to automatically overwrite the file comment out these lines.  Or add a parameter.
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
            } else {
                //safety check 
                console.log(`The file could not be validated.  File contents have been changed since originally uploaded.  New filehash value is ${hashResult.toString('hex')}`);

            }

        }
        )
    }
});
