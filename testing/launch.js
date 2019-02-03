var genKeyPair = require('../utilities/generateKeypair');
var uploadFile = require('../utilities/uploadFile');
var downloadFile = require('../utilities/downloadFile');
var assert = require('assert');
var fs = require('fs');

//Create a new, empty database.
var now = new Date();
var databaseName = `CodeChainTest`;

//get more details on unhandled rejection errors, because they can be cryptic
process.on('unhandledRejection', (reason, p) => {
    FailConsoleLog('Failure: ' + JSON.stringify(p) + reason);
});


//set flags to get us in test mode. 
process.env.DATABASE = databaseName;
process.env.PORT = 3000;
process.env.DISABLENETWORKSYNC = true;
process.env.FIXEDDIFFICULTY = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var baseUri = `http://localhost:${process.env.PORT}`;

var TestFileContents = {
    TestFile1: "Test file one contents."
};

var CreateSubmitRequestTest = (async () => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    var uploadResult = await uploadFile.UploadFile(baseUri, 'TestFile1.txt', TestFileContents.TestFile1, keypair1.PublicKey, keypair1.PrivateKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success) {
        SuccessConsoleLog('Successfully uploaded file via createSubmitRequest');
    } else {
        FailConsoleLog('Failure uploading file.');
    }
});

var CreateSubmitEncryptedRequestTest = (async () => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    var uploadResult = await uploadFile.UploadEncryptedFile(baseUri, 'TestFile1.txt', TestFileContents.TestFile1, keypair1.PublicKey, keypair1.PrivateKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success) {
        SuccessConsoleLog('Successfully uploaded file via createSubmitRequestEncrypted');
    } else {
        FailConsoleLog('Failure uploading file to createSubmitRequestEncrypted.');
    }
});

var CreateAndSubmitRequestTest = (async () => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    var creqteRequestResult = await uploadFile.CreateRequest(baseUri, TestFileContents.TestFile1, keypair1.PrivateKey);
    var creqteRequestResultObj = JSON.parse(creqteRequestResult);
    if (creqteRequestResultObj.Success && creqteRequestResultObj.Signature.length > 0) {
        SuccessConsoleLog('Successfully created a Submit Request');
        var submitResult = await uploadFile.SubmitRequest(baseUri, "TestFile1.txt", creqteRequestResultObj.Signature, keypair1.PublicKey, TestFileContents.TestFile1, creqteRequestResultObj.Salt, "Submitted via test launcher.");
        var submitResultObj = JSON.parse(submitResult);
        if (submitResultObj.Success) {
            SuccessConsoleLog('Successfully submitted a file');
        } else {
            FailConsoleLog('Failure submitting file.' + submitResultObj.ErrorMessage);
        }
    } else {
        FailConsoleLog('Failure creating Submit Request.' + creqteRequestResultObj.ErrorMessage);
    }
});

var CreateAndSubmitEncryptedRequestTest = (async () => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    var uploadResult = await uploadFile.CreateEncryptedRequest(baseUri, TestFileContents.TestFile1, keypair1.PrivateKey, keypair1.PublicKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success && uploadResultObj.Signature.length > 0) {
        SuccessConsoleLog('Successfully created an Encrypted Submit Request');
        var submitResult = await uploadFile.SubmitEncryptedRequest(baseUri, "TestFile1.txt", uploadResultObj.Signature, keypair1.PublicKey, uploadResultObj.Encrypted, uploadResultObj.Salt, "Submitted via test launcher.");
        var submitResultObj = JSON.parse(submitResult);
        if (submitResultObj.Success) {
            SuccessConsoleLog('Successfully submitted an encrypted file');
        } else {
            FailConsoleLog('Failure submitting encrypted file.' + submitResultObj.ErrorMessage);
        }
    } else {
        FailConsoleLog('Failure creating Encrypted Submit Request.' + uploadResultObj.ErrorMessage);
    }
});

var SuccessConsoleLog = ((text) => {
    console.log(`\x1b[32m${text}\x1b[0m`);
});

var FailConsoleLog = ((text) => {
    console.log(`\x1b[31m${text}\x1b[0m`);
});

var server = require('../server');
var mongoose = require('../db/mongoose');
mongoose.GetDb().then((db) => {
    //clean out the test db on each run.
    db.collection('blocks').drop().then(() => { }, (err) => { });
    db.collection('mempools').drop().then(() => { }, (err) => { });
    db.collection('nodes').drop().then(() => { }, (err) => { });
    db.collection('orphanedBlocks').drop().then(() => { }, (err) => { });

    server.StartServer(async () => {
        CreateSubmitRequestTest();
        CreateAndSubmitRequestTest();
        CreateAndSubmitEncryptedRequestTest();
        CreateSubmitEncryptedRequestTest();
    });
});








// setTimeout(function (uploadResultObj) {
//     var url = `${baseUri}/file/get`;
//     downloadFile.DownloadFile(url, uploadResultObj.Hash).then((r1) => {
//         var r2 = JSON.parse(r1);
//         //assert.fail('this s a test');
//         if (!r2.Success) {
//             FailConsoleLog('Failed to download file. ' + r2.ErrorMessage);
//             return;
//         }
//         else if (r2.FileContents != TestFileContents.TestFile1) {
//             FailConsoleLog('Invalid file contents');
//             return;
//         }else{
//             SuccessConsoleLog('Test Success.');
//         }
//     }).catch((ex) => {
//         assert.fail('Error:' + ex);
//     })
// }, 10000, uploadResultObj);