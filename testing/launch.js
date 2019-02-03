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
    TestFile1: "Test file one contents.",
    TestFile2: "Test file two contents."
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

var CreateAndSubmitEncryptedRequestRepoTest = (async (keypair) => {
    var repohash = await uploadFile.GetRepoHash(baseUri);
    var repohashObj = JSON.parse(repohash);
    var repo = { Name: 'My Repository2', Hash: repohashObj.Hash, Directory: '/subdir' };

    var uploadResult = await uploadFile.CreateEncryptedRequest(baseUri, TestFileContents.TestFile1, keypair.PrivateKey, keypair.PublicKey, repo);
    var uploadResultObj = JSON.parse(uploadResult);
    if (uploadResultObj.Success && uploadResultObj.Signature.length > 0) {
        SuccessConsoleLog('Successfully created an Encrypted Submit Request');
        var submitResult = await uploadFile.SubmitEncryptedRequest(baseUri, "TestFile1.txt", uploadResultObj.Signature, keypair.PublicKey, uploadResultObj.Encrypted, uploadResultObj.Salt, "Submitted via test launcher with repo.", repo);
        var submitResultObj = JSON.parse(submitResult);
        if (submitResultObj.Success) {
            SuccessConsoleLog('Successfully submitted an encrypted file in a repo');
            return repohashObj.Hash;
        } else {
            FailConsoleLog('Failure submitting encrypted file in a repo.' + submitResultObj.ErrorMessage);
        }
    } else {
        FailConsoleLog('Failure creating Encrypted Submit Request in a repo.' + uploadResultObj.ErrorMessage);
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
        FailConsoleLog('Error downloading file ' + hash + downloadResultObj.ErrorMessage);
    }
});

var DownloadRepoHash = (async (repoHash) => {
    var downloadResult = await downloadFile.DownloadRepo(baseUri, repoHash);
    var downloadResultObj = JSON.parse(downloadResult);
    if (downloadResultObj.Success) {
        let buff = new Buffer.from(downloadResultObj.Repo[0].FileContents, 'base64');
        let text = buff.toString('ascii');
        if (TestFileContents.TestFile1 == text) {
            SuccessConsoleLog('Successfully downloaded repo file #1 ');
        } else {
            FailConsoleLog(`Downloaded repo file #1 but contents did not match. ${TestFileContents.TestFile1} vs ${text}`);
        }
        let buff2 = new Buffer.from(downloadResultObj.Repo[1].FileContents, 'base64');
        let text2 = buff2.toString('ascii');
        if (TestFileContents.TestFile2 == text2) {
            SuccessConsoleLog('Successfully downloaded repo file #2');
        } else {
            FailConsoleLog(`Downloaded repo file #2 but contents did not match. ${TestFileContents.TestFile1} vs ${text}`);
        }
    } else {
        FailConsoleLog('Error downloading repo ' + repoHash + downloadResultObj.ErrorMessage);
    }
});

var DownloadRepoEncrypted = (async (keypair, repoHash) => {
    var downloadResult = await downloadFile.DownloadRepoEncrypted(baseUri, repoHash, keypair.PrivateKey);
    var downloadResultObj = JSON.parse(downloadResult);
    if (downloadResultObj.Success) {
        let buff = new Buffer.from(downloadResultObj.Repo[0].FileContents, 'base64');
        let text = buff.toString('ascii');
        if (TestFileContents.TestFile1 == text) {
            SuccessConsoleLog('Successfully downloaded encrypted repo file.');
        } else {
            FailConsoleLog(`Downloaded encrypted repo file #1 but contents did not match. ${TestFileContents.TestFile1} vs ${text}`);
        }
    } else {
        FailConsoleLog('Error downloading encrypted repo ' + repoHash + downloadResultObj.ErrorMessage);
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


var CreateSubmitRepoRequestTest = (async (keypair) => {
    var repohash = await uploadFile.GetRepoHash(baseUri);
    var repohashObj = JSON.parse(repohash);
    var repo = { Name: 'My Repository', Hash: repohashObj.Hash, Directory: '.' };
    var uploadResult1 = await uploadFile.UploadFile(baseUri, 'TestFile1.txt', TestFileContents.TestFile1, keypair.PublicKey, keypair.PrivateKey, repo);
    var uploadResult2 = await uploadFile.UploadFile(baseUri, 'TestFile2.txt', TestFileContents.TestFile2, keypair.PublicKey, keypair.PrivateKey, repo);
    var uploadResultObj1 = JSON.parse(uploadResult1);
    var uploadResultObj2 = JSON.parse(uploadResult2);
    if (uploadResultObj1.Success && uploadResultObj2.Success) {
        SuccessConsoleLog('Successfully uploaded two files in a repo via createSubmitRequest');
        return repohashObj.Hash;
    } else {
        FailConsoleLog('Failure uploading two files in a repo.');
    }
});

var SuccessConsoleLog = ((text) => {
    console.log(`\x1b[32m${text}\x1b[0m`);
});

var FailConsoleLog = ((text) => {
    console.log(`\x1b[31m${text}\x1b[0m`);
});

var GetFileListTest = (async (address) => {
    var fileList = await downloadFile.GetFileList(baseUri, address);
    var fileListObj = JSON.parse(fileList);
    debugger;
    if (fileListObj.Success && fileListObj.Files.length > 0) {
        SuccessConsoleLog(`Successfully retrieved list of ${fileListObj.Files.length} files for address ${address}`);
    }else{
        FailConsoleLog(`Could not download file list of address ${address}`)
    }
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
        var repoHash = await CreateSubmitRepoRequestTest(keypair);
        var encryptedRepo = await CreateAndSubmitEncryptedRequestRepoTest(keypair);

        setTimeout(async (hash1, hash2, hash3, hash4, repoHash) => {
            DownloadFileTest(hash1);
            DownloadFileTest(hash2);
            DownloadEncryptedFileTest(hash3, keypair.PrivateKey);
            DownloadEncryptedFileTest(hash4, keypair.PrivateKey);
            DownloadRepoHash(repoHash);
            DownloadRepoEncrypted(keypair, encryptedRepo);
            GetFileListTest(keypair.Address);
        }, 10000, hash1, hash2, hash3, hash4, repoHash, encryptedRepo);
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