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


var CreateSubmitRequestTest = (async (keypair) => {
    var uploadResult = await uploadFile.UploadFile(baseUri, 'TestFile1.txt', TestFileContents.TestFile1, keypair.PublicKey, keypair.PrivateKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success) {
        SuccessConsoleLog('Successfully uploaded file via createSubmitRequest');
        return uploadResultObj.Hash;
    } else {
        FailConsoleLog('Failure uploading file.');
    }
});

var CreateSubmitEncryptedRequestTest = (async (keypair) => {
    var uploadResult = await uploadFile.UploadEncryptedFile(baseUri, 'TestFile1.txt', TestFileContents.TestFile1, keypair.PublicKey, keypair.PrivateKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success) {
        SuccessConsoleLog('Successfully uploaded file via createSubmitRequestEncrypted');
        return uploadResultObj.Hash;
    } else {
        FailConsoleLog('Failure uploading file to createSubmitRequestEncrypted.');
    }
});

var CreateAndSubmitRequestTest = (async (keypair) => {
    var creqteRequestResult = await uploadFile.CreateRequest(baseUri, TestFileContents.TestFile1, keypair.PrivateKey);
    var creqteRequestResultObj = JSON.parse(creqteRequestResult);
    if (creqteRequestResultObj.Success && creqteRequestResultObj.Signature.length > 0) {
        SuccessConsoleLog('Successfully created a Submit Request');
        var submitResult = await uploadFile.SubmitRequest(baseUri, "TestFile1.txt", creqteRequestResultObj.Signature, keypair.PublicKey, TestFileContents.TestFile1, creqteRequestResultObj.Salt, "Submitted via test launcher.");
        var submitResultObj = JSON.parse(submitResult);
        if (submitResultObj.Success) {
            SuccessConsoleLog('Successfully submitted a file');
            return submitResultObj.Hash;
        } else {
            FailConsoleLog('Failure submitting file.' + submitResultObj.ErrorMessage);
        }
    } else {
        FailConsoleLog('Failure creating Submit Request.' + creqteRequestResultObj.ErrorMessage);
    }
});

var CreateAndSubmitEncryptedRequestTest = (async (keypair) => {
    var uploadResult = await uploadFile.CreateEncryptedRequest(baseUri, TestFileContents.TestFile1, keypair.PrivateKey, keypair.PublicKey);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success && uploadResultObj.Signature.length > 0) {
        SuccessConsoleLog('Successfully created an Encrypted Submit Request');
        var submitResult = await uploadFile.SubmitEncryptedRequest(baseUri, "TestFile1.txt", uploadResultObj.Signature, keypair.PublicKey, uploadResultObj.Encrypted, uploadResultObj.Salt, "Submitted via test launcher.");
        var submitResultObj = JSON.parse(submitResult);
        if (submitResultObj.Success) {
            SuccessConsoleLog('Successfully submitted an encrypted file');
            return submitResultObj.Hash;
        } else {
            FailConsoleLog('Failure submitting encrypted file.' + submitResultObj.ErrorMessage);
        }
    } else {
        FailConsoleLog('Failure creating Encrypted Submit Request.' + uploadResultObj.ErrorMessage);
    }
});

var DownloadFileTest = (async (hash) => {
    var downloadResult = await downloadFile.DownloadFile(baseUri, hash);
    
    var downloadResultObj = JSON.parse(downloadResult);
    if (downloadResultObj.Success) {
        let buff = new Buffer.from(downloadResultObj.FileContents, 'base64');
        let text = buff.toString('ascii');
        if (TestFileContents.TestFile1 == text) {
            SuccessConsoleLog('Successfully downloaded file ' + hash);
        } else {
            FailConsoleLog(`Downloaded file but contents did not match.`);// ${TestFileContents.TestFile1} vs ${text}`);
        }
    } else {
        FailConsoleLog('Error downloading file ' + hash);
    }
});


var DownloadEncryptedFileTest = (async (hash, privatekey) => {
    var downloadResult = await downloadFile.DownloadEncryptedFile(baseUri, hash, privatekey);
    var downloadResultObj = JSON.parse(downloadResult);
    if (downloadResultObj.Success) {
        let buff = new Buffer.from(downloadResultObj.FileContents, 'base64');
        let text = buff.toString('ascii');
        if (TestFileContents.TestFile1 == text) {
            SuccessConsoleLog('Successfully downloaded encrypted file ' + hash);
        } else {
            FailConsoleLog(`Downloaded encrypted file but contents did not match.`);// ${TestFileContents.TestFile1} vs ${text}`);
        }
    } else {
        FailConsoleLog('Error downloading encrypted file ' + hash);
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
        var keypair = await genKeyPair.GenerateKeyPair();
        var hash1 = await CreateSubmitRequestTest(keypair);
        var hash2 = await CreateAndSubmitRequestTest(keypair);
        var hash3 = await CreateAndSubmitEncryptedRequestTest(keypair);
        var hash4 = await CreateSubmitEncryptedRequestTest(keypair);

        setTimeout(async (hash1, hash2, hash3, hash4) => {
            DownloadFileTest(hash1);
            DownloadFileTest(hash2);
            DownloadEncryptedFileTest(hash3, keypair.PrivateKey);
            DownloadEncryptedFileTest(hash4, keypair.PrivateKey);
        }, 10000, hash1, hash2, hash3, hash4);
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