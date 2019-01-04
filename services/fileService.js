let keyController = require('../controllers/keyController.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query')

var StartService = ((app) => {

    app.post('/uploadfile', (request, response) => {
        var filename = request.body.filename;
        var fileContents = request.body.filecontents;
        var publicKey = request.body.publickey;
        var privateKey = request.body.privatekey;
        console.log(filename, fileContents, publicKey, privateKey);

        var signedMessage = keyController.SignMessage(fileContents, new Buffer(privateKey, 'hex'));
        memPoolController.AddCodeFileToMemPool(filename, fileContents, signedMessage, publicKey)
            .then((result) => {
                response.send(result);
            }, (err) => {
                response.send('error: ' + err);
            })
            .catch((ex) => {
                response.send('exception: ' + ex);
            })
    });

    app.get('/getfile', (request, response) => {
        blockController.GetFileFromBlock(request.query.filehash)
            .then((block) => {
                if (block.length > 0) {
                    var jsonQueryResult = jsonQuery('data[hash=' + request.query.filehash + ']', {
                        data: block
                    });
                    response.send({
                        file: jsonQueryResult.value
                    });
                } else {
                    response.send('File not found');
                }
            }, (error) => {
                console.log(error);
            })
            .catch((ex) => {
                console.log(ex);
            })

    });

});

module.exports = {
    StartService
}