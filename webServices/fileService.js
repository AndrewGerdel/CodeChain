let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query')

var StartService = ((app) => {

    app.post('/file/upload', async (request, response) => {
        var filename = request.body.filename;
        var fileContents = request.body.filecontents;
        var publicKey = request.body.publickey;
        var privateKey = request.body.privatekey;
        console.log(`Received file ${filename}`);

        try
        {
            var result = await ProcessRequest(filename, fileContents, publicKey, privateKey);
            response.send({Success: true, Hash: result.hash});
        }catch(ex){
            response.send({Success: false, ErrorMessage: ex.toString()});
        }
    });

    app.get('/file/get', async(request, response) => {
        var block = await blockController.GetFileFromBlock(request.query.filehash);
        if (block.length > 0) {
            var jsonQueryResult = jsonQuery('data[hash=' + request.query.filehash + ']', {
                data: block
            });
            response.send({
                fileContents: jsonQueryResult.value.fileData.fileContents
            });
        } else {
            response.send('File not found');
        }
    });

});

var ProcessRequest = (async (filename, fileContents, publicKey, privateKey) => {
    let buff = new Buffer.from(fileContents);
    let base64data = buff.toString('base64');
    var signedMessage = await hash.SignMessage(privateKey, base64data);
    var result = await memPoolController.AddCodeFileToMemPool(filename, base64data, signedMessage, publicKey);
    return result;
});

module.exports = {
    StartService,
    ProcessRequest
}