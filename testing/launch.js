var genKeyPair = require('../utilities/generateKeypair');
var uploadFile = require('../utilities/uploadFile');
var downloadFile = require('../utilities/downloadFile');
var assert = require('assert');
var fs = require('fs');

//Create a new, empty database.
var now = new Date();
var databaseName = `CodeChain_${now.getFullYear()}${now.getMonth()}${now.getDay()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

//set flags to get us in test mode. 
process.env.DATABASE = databaseName;
process.env.PORT = 8877;
process.env.DISABLENETWORKSYNC = true;
process.env.FIXEDDIFFICULTY = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var baseUri = `http://localhost:${process.env.PORT}`;



var TestFileContents = {
    TestFile1: "Test file one contents."
};

var RunTests = (async () => {
    Test1();
});



var Test1 = (async () => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    var uploadResult = await uploadFile.UploadFile(`${baseUri}/file/createSubmitRequest`, 'TestFile1.txt', TestFileContents.TestFile1, keypair1.PublicKey, keypair1.PrivateKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success) {
        setTimeout(function (uploadResultObj) {
            var url = `${baseUri}/file/get`;
            downloadFile.DownloadFile(url, uploadResultObj.Hash).then((r1) => {
                debugger;
                var r2 = JSON.parse(r1);
                //assert.fail('this s a test');
                debugger;
                if (!r2.Success) {
                    FailConsoleLog('Failed to download file. ' + r2.ErrorMessage);
                    return;
                }
                else if (r2.FileContents != TestFileContents.TestFile1) {
                    FailConsoleLog('Invalid file contents');
                    return;
                }else{
                    SuccessConsoleLog('Test Success.');
                }
            }).catch((ex) => {
                assert.fail('Error:' + ex);
            })
        }, 10000, uploadResultObj);
    } else {
        FailConsoleLog('Failure uploading file.');
    }
});

var SuccessConsoleLog = ((text) => {
    console.log(`\x1b[32m${text}\x1b[0m`);
});

var FailConsoleLog = ((text) => {
    console.log(`\x1b[31m${text}\x1b[0m`);
});


var server = require('../server')
setTimeout(() => {
    RunTests();
}, 5000)

