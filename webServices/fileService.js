let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query')
let crypto = require('crypto');
let crypto2 = require('crypto2');

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

    //Creates a signed request.  Should be called on a secure or offline PC as private key is required. 
    app.post('/file/createEncryptedRequest', async (request, response) => {
        try {
            var fileContents = request.body.filecontents;
            var privateKey = request.body.privatekey;
            var publicKey = request.body.publicKey;
            var repo = request.body.repo;

            // var repoName = request.body.repoName;
            // var repoHash = request.body.repoHash;
            var salt = crypto.randomBytes(16).toString('hex');
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');

            const encrypted = await crypto2.encrypt.rsa(base64data, publicKey);

            var signature = await hash.SignMessage(privateKey, `${salt}${encrypted}${repo}`);
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

    //Submits the signed request.  Should be sent to an online computer.
    app.post('/file/submitRequest/encrypted', async (request, response) => {
        try {
            var filename = request.body.filename;
            var signature = request.body.signature;
            var publicKey = request.body.publickey;
            var repo = request.body.repo;
            var fileContents = request.body.filecontents;
            var salt = request.body.salt;
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');

            const encrypted = await crypto2.encrypt.rsa(base64data, publicKey);

            console.log(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, encrypted, signature, publicKey, repo);
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

    //Creates and submits a signed request.  Should be called on a secure node as private key is required. 
    app.post('/file/createSubmitRequestEncrypted', async (request, response) => {
        try {
            var filename = request.body.filename;
            var fileContents = request.body.filecontents;
            var publicKey = request.body.publickey;
            var privateKey = request.body.privatekey;
            var repo = request.body.repo;
            var salt = crypto.randomBytes(16).toString('hex');
            let buff = new Buffer.from(fileContents);
            let base64data = buff.toString('base64');

            const encrypted = await crypto2.encrypt.rsa(base64data, publicKey);
            var signature = await hash.SignMessage(privateKey, `${salt}${encrypted}${repo}`);
            
            console.log(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, encrypted, signature, publicKey, repo);
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
                response.send({ Success: true, FileContents: jsonQueryResult.value.fileData.fileContents, FileName: jsonQueryResult.value.fileData.fileName, Signature: jsonQueryResult.value.signedMessage, DateAdded: jsonQueryResult.value.dateAdded, Salt: jsonQueryResult.value.salt, Repo: jsonQueryResult.value.fileData.repo });
            } else {
                response.send({ Success: false, ErrorMessage: "File not found" });
            }
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.post('/file/getEncrypted', async (request, response) => {
        try {
            var block = await blockController.GetFileFromBlock(request.body.filehash);
            var privateKey = request.body.privatekey;
            if (block.length > 0) {
                var jsonQueryResult = jsonQuery('data[hash=' + request.body.filehash + ']', {
                    data: block
                });

                const decrypted = await crypto2.decrypt.rsa(jsonQueryResult.value.fileData.fileContents, privateKey);

                response.send({ Success: true, FileContents: decrypted, FileName: jsonQueryResult.value.fileData.fileName, Signature: jsonQueryResult.value.signedMessage, DateAdded: jsonQueryResult.value.dateAdded, Salt: jsonQueryResult.value.salt, Repo: jsonQueryResult.value.fileData.repo });
            } else {
                response.send({ Success: false, ErrorMessage: "File not found" });
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
            var repo = await blockController.GetRepoFromBlock(request.query.repohash);
            response.send(repo);
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getRepoEncrypted', async (request, response) => {
        try {
            var privateKey = request.body.privatekey;
            var repo = await blockController.GetRepoFromBlockEncrypted(request.body.repohash, privateKey);
            response.send(repo);
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getFileList', async (request, response) => {
        try {
            var repo = await blockController.GetFilesByAddress(request.query.address);
            response.send(repo);
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
    app.get('/file/getRepoList', async (request, response) => {
        try {
            var repo = await blockController.GetReposByAddress(request.query.address);
            response.send(repo);
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
});


module.exports = {
    StartService
}