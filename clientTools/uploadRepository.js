//Simple but functional proof of concept to submit a directory/repository to the CodeChain Network.
var request = require('request');
var fs = require('fs');
var path = require('path');
var yargs = require('yargs');

var baseUrl = "http://127.0.0.1:65340/"

var dir = yargs.argv.dir;
if (!dir) {
    console.log("Missing --dir parameter.  Provide path of directory to upload.");
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
var projectName = yargs.argv.projectName;
if (!projectName){
    console.log("Missing --projectName parameter.  Provide a name for your project.");
    return;
}
var node = yargs.argv.node;
if (node)
    baseUrl = node;

if (!fs.existsSync(dir))
    throw new Error(`${dir} does not exist`);
if (!fs.existsSync(public))
    throw new Error(`${public} does not exist`);
if (!fs.existsSync(private))
    throw new Error(`${private} does not exist`);

// var filename = path.basename(file);
// var filecontents = fs.readFileSync(file);
var publickey = fs.readFileSync(public).toString();
var privatekey = fs.readFileSync(private).toString();


var loopPostRepo = (async (nodeEndpoint) => {

    console.log('Endpoint is', nodeEndpoint);

    const data = JSON.stringify({
        filename: 'postedFile.txt',
        filecontents: 'The current time is ' + new Date(),
        publickey: testAddresses.Timmy().PublicKey,
        privatekey: testAddresses.Timmy().PrivateKey,
        repo: 'My Special Repo'
    });

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
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            console.log(body);
        }

        setTimeout((evenOdd) => {
            if (nodeEndpoint == "http://127.0.0.1:65340/file/createSubmitRequest") {
                nodeEndpoint = "http://127.0.0.1:65340/file/createSubmitRequest";  //put your alternating url here. 
            } else {
                nodeEndpoint = "http://127.0.0.1:65340/file/createSubmitRequest";
            }
            loopPost(nodeEndpoint);
        }, 50000);
    });

});


var CreateRequest = (async (repoHash, file, filecontents) => {
    var repo = { Name: projectName, Hash: repoHash, File: file };
    const data = JSON.stringify({
        filecontents: filecontents,
        privatekey: privatekey,
        repo: repo
    });
    const options = {
        uri: baseUrl+'file/createRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }
    request(options, (err, res, body) => {
        if (err) {
            console.log('FAILURE:', err);
        } else {
            var bodyObj = JSON.parse(body);
            //console.log('signature is', bodyObj.Signature);
            SubmitRequest(path.basename(file), filecontents, bodyObj.Signature, bodyObj.Salt, publickey, repo);
        }
    });
});

var SubmitRequest = ((filename, filecontents, signature, salt, publickey, repo) => {
    const data = JSON.stringify({
        filename: filename,
        signature: signature,
        publickey: publickey,
        repo: repo,
        filecontents: filecontents,
        salt: salt
    });
    const options = {
        uri: baseUrl+'file/submitRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('FAILURE:', err);
        } else {
            // console.log('SubmitResult: ', body);
            console.log(`File ${filename} uploaded to repository ${repo.Hash}. `);
            
        }
    });
});

var WalkDir = function (dir, parentDir, done) {
    if (parentDir == '') {
        parentDir = dir;
    }
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    WalkDir(file, parentDir, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    file = file.replace(parentDir, '');
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};

var PostDirToNewRepo = ((dir) => {
    request(`${baseUrl}file/getNewRepoHash`, (res, err, body) => {
        var bodyObj = JSON.parse(body);
        var hash = bodyObj.Hash;
        console.log(`Uploading to repo hash ${hash}`);
        WalkDir(dir, '', (err, result) => {
            result.forEach((item) => {
                var fileContents = fs.readFileSync(dir + item);
                CreateRequest(hash, item, fileContents);
            });
        })
    });
});


PostDirToNewRepo(dir);
