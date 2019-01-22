//Simple but functional proof of concept to download a file from the CodeChain Network.
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');

var nodeEndpoint = "http://127.0.0.1:65340/file/getRepo";
var destination = "c:\\FakeRepo\\Dir1";

if (!yargs.argv.repohash) {
    console.log('Missing parameter --repohash.');
    return;
}

if (!fs.existsSync(destination))
    fs.mkdirSync(destination, { recursive: true });

request(nodeEndpoint + '?repohash=' + yargs.argv.repohash, (err, res, body) => {
    if (err) {
        console.log('ERROR :', err);
    } else {
        //console.log(body);
        var bodyObj = JSON.parse(body);

        bodyObj.forEach(element => {
            var saveToFilePath = destination + element.Path;
            if (fs.existsSync(saveToFilePath)) {
                console.log(`ERROR: File ${saveToFilePath} already exists.  Will not overwrite.`);
            } else {
                var dirOnly = path.dirname(saveToFilePath);

                if (!fs.existsSync(dirOnly))
                    fs.mkdirSync(dirOnly, { recursive: true });
                let buff = new Buffer.from(element.FileContents, 'base64');
                fs.writeFile(saveToFilePath, buff, function (err) {
                    if (err) {
                        return console.log('Error: ' + err);
                    }
                    console.log("The file was saved to ", saveToFilePath);
                });
            }

        });
        // //console.log(bodyObj.FileContents);
        // let buff = new Buffer.from(bodyObj.FileContents, 'base64');
        // // let text = buff.toString('ascii');
        // var saveToFilePath = destination + bodyObj.FileName;
        // if (fs.existsSync(saveToFilePath)) {
        //     console.log('File already exists. Will not overwrite ', saveToFilePath);
        //     return;
        // }
        // fs.writeFile(saveToFilePath, buff, function (err) {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     console.log("The file was saved to ", saveToFilePath);
        // });

    }
});
