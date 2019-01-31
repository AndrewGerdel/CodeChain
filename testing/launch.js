var genKeyPair = require('../utilities/generateKeypair');
var uploadFile = require('../utilities/uploadFile');
var downloadFile = require('../utilities/downloadFile');
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
        console.log('setting timeout');
        setTimeout(function (uploadResultObj) {
            var url = `${baseUri}/file/get`;
            console.log('the url is ', url);
            downloadFile.DownloadFile(url, uploadResultObj.Hash).then((r1) => {
                console.log(r1);
            }).catch((ex) => {
                console.log('ERROR', ex);
            })
        }, 3000, uploadResultObj);
    } else {
        console.log('fail', uploadResult);
    }
});

var server = require('../server')
setTimeout(() => {
    RunTests();
}, 5000)

