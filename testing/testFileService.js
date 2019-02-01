var assert = require('assert');
var genKeyPair = require('../utilities/generateKeypair');
var uploadFile = require('../utilities/uploadFile');
var downloadFile = require('../utilities/downloadFile');
var blockRepository = require('../repositories/blockRepository');
var baseUri = `http://localhost:${process.env.PORT}`;


describe('FileService', function () {
    this.timeout(15000); //extend the test timeout value to 15 seconds. 
    var fileHash = '';
    describe('UploadFile', function () {
        it('should upload a basic file.', async function () {
            var keypair = await genKeyPair.GenerateKeyPair();
            var uploadFileResult = await uploadFile.UploadFile(`${baseUri}/file/createSubmitRequest`, 'TestFile1.txt', "Basic file contents", keypair.PublicKey, keypair.PrivateKey);
            var uploadResultObj = JSON.parse(uploadFileResult);
            assert.equal(uploadResultObj.Success, true);
            fileHash = uploadResultObj.Hash;
        });

    });
    // describe('DownloadFile', function () {
    //     it('should download a basic file.', async function () {
    //         console.log('filehash is ', fileHash);
    //         var downloadResult = await downloadFile.DownloadFile(`${baseUri}/file/get`, fileHash);
    //         var downloadResultObj = JSON.parse(downloadResult);
    //         assert.equal(downloadResultObj.Success, true, downloadResultObj.ErrorMessage);

    //     });
    // });
});



// describe('FileService', function () {
//     describe('UploadDownload', function () {
//         it('should upload then download a basic file', function (done) {
//             assert.equal([1, 2, 3].indexOf(4), -1);
//             //             genKeyPair.GenerateKeyPair().then((keypair1) => {
//             //                 uploadFile.UploadFile(`${baseUri}/file/createSubmitRequest`, 'TestFile1.txt', "Basic file contents", keypair1.PublicKey, keypair1.PrivateKey).then((uploadResult) => {
//             //                     var uploadResultObj = JSON.parse(uploadResult);
//             //                     debugger;
//             //                     assert.equal(uploadResultObj.Success, true);
//             // done();
//             //                 })

//             //             });


//             // assert.fail('this isnot working');
//             // var count = 0;
//             // do {
//             //     var downloadResult = await downloadFile.DownloadFile(`${baseUri}/file/get`, uploadResultObj.Hash);
//             //     var downloadResultObj = JSON.parse(downloadResult);
//             //     if (downloadResultObj.Success) {
//             //         console.log(downloadResult);
//             //         assert.equal(downloadResultObj.Success, true);
//             //     }
//             //     count++;
//             // } while (!downloadResultObj.Success && count < 10);


//         });
//     });
// });