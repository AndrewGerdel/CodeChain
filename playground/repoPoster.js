var request = require('request');
var testAddresses = require('./testAddresses.js');
var fs = require('fs');
var path = require('path');

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
    var repo = { Name: 'Friendly Project', Hash: repoHash, File: file };
    debugger;
    const data = JSON.stringify({
        filecontents: filecontents,
        privatekey: testAddresses.Timmy().PrivateKey,
        repo: repo
    });
    const options = {
        uri: 'http://localhost:65340/file/createRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }
    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            var bodyObj = JSON.parse(body);
            //console.log('signature is', bodyObj.Signature);
            SubmitRequest(file, filecontents, bodyObj.Signature, bodyObj.Salt, testAddresses.Timmy().PublicKey, repo);
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
        uri: 'http://localhost:65340/file/submitRequest',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            console.log('SubmitResult: ', body);
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

var PostDirToNewRepo = (() => {

    request('http://localhost:65340/file/getNewRepoHash', (res, err, body) => {
        debugger;
        var bodyObj = JSON.parse(body);
        var hash = bodyObj.Hash;
        var rootDir = `C:\\Users\\Andrew\\Documents\\New folder`;
        WalkDir(rootDir, '', (err, result) => {
            result.forEach((item) => {
                var fileContents = fs.readFileSync(rootDir + item);
                CreateRequest(hash, item, fileContents);
            });
        })
    });
});

PostDirToNewRepo();