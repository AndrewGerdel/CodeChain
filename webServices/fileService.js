let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query')
let crypto = require('crypto');

var StartService = ((app) => {

    //Creates a signed request.  Should be called on a secure or offline PC as private key is required. 
    app.post('/file/createRequest', async (request, response) => {
        try {
            var fileContents = request.body.filecontents;
            var privateKey = request.body.privatekey;
            var repo = request.body.repo;

            // var repoName = request.body.repoName;
            // var repoHash = request.body.repoHash;
            var salt = crypto.randomBytes(16).toString('hex');
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');
            var signature = await hash.SignMessage(privateKey, `${salt}${base64data}${repo}`);
            response.send({ Success: true, Signature: signature, Salt: salt });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //Submits the signed request.  Should be sent to an online computer.
    app.post('/file/submitRequest', async (request, response) => {
        try {
            var filename = request.body.filename;
            var signature = request.body.signature;
            var publicKey = request.body.publickey;
            debugger;
            var repo = request.body.repo;
            var fileContents = request.body.filecontents;
            var salt = request.body.salt;
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');

            console.log(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, base64data, signature, publicKey, repo);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //Creates and submits a signed request.  Should be called on a secure node as private key is required. 
    app.post('/file/createSubmitRequest', async (request, response) => {
        try {
            var filename = request.body.filename;
            var fileContents = request.body.filecontents;
            var publicKey = request.body.publickey;
            var privateKey = request.body.privatekey;
            var repo = request.body.repo;

            var salt = crypto.randomBytes(16).toString('hex');
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');
            var signature = await hash.SignMessage(privateKey, `${salt}${base64data}${repo}`);

            console.log(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, base64data, signature, publicKey, repo);
            response.send({ Success: true, Hash: result.hash });

        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }

    });

    app.get('/file/get', async (request, response) => {
        try {
            var block = await blockController.GetFileFromBlock(request.query.filehash);
            if (block.length > 0) {
                var jsonQueryResult = jsonQuery('data[hash=' + request.query.filehash + ']', {
                    data: block
                });
                response.send({ Success: true, FileContents: jsonQueryResult.value.fileData.fileContents });
            } else {
                response.send('File not found');
            }
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getNewRepoHash', async (request, response) => {
        try {
            //For now this is just a random hash.  In the future, we could want to add additional functionality. 
            var random = crypto.randomBytes(16);
            var randomHash = await hash.CreateSha256Hash(random.toString('hex'));
            response.send({ Hash: randomHash.toString('hex') });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getRepo', async (request, response) => {
        try {
            //  request.query.repohash
            var todo = await blockController.GetRepoFromBlock(request.query.repohash);
            response.send(todo);
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
});


module.exports = {
    StartService
}