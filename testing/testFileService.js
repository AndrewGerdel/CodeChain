var assert = require('assert');
var genKeyPair = require('../utilities/generateKeypair');
var uploadFile = require('../utilities/uploadFile');
var downloadFile = require('../utilities/downloadFile');
var blockRepository = require('../repositories/blockRepository');
var baseUri = `http://localhost:${process.env.PORT}`;

describe('FileService', function () {
    describe('UploadDownload', function () {
        it('should upload then download a basic file', async function () {
            var keypair1 = await genKeyPair.GenerateKeyPair();
            var uploadResult = await uploadFile.UploadFile(`${baseUri}/file/createSubmitRequest`, 'TestFile1.txt', "Basic file contents", keypair1.PublicKey, keypair1.PrivateKey);
            var uploadResultObj = JSON.parse(uploadResult);
            assert.equal(uploadResultObj.Success, true);


            assert.fail('this isnot working');
            var count = 0;
            do {
                var downloadResult = await downloadFile.DownloadFile(`${baseUri}/file/get`, uploadResultObj.Hash);
                var downloadResultObj = JSON.parse(downloadResult);
                if (downloadResultObj.Success) {
                    console.log(downloadResult);
                    assert.equal(downloadResultObj.Success, true);
                }
                count++;
            } while (!downloadResultObj.Success && count < 10);


        });
    });
});