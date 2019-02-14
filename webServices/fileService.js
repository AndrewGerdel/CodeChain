let hash = require('../utilities/hash.js');
let memPoolController = require('../controllers/memPoolController.js');
let blockController = require('../controllers/blockController.js');
let jsonQuery = require('json-query')
let crypto = require('crypto');
let crypto2 = require('crypto2');
let blockLogger = require('../loggers/blockProcessLog');

var StartService = ((app) => {

    //Creates a signed request.  Should be called on a secure or offline PC as private key is required. 
    app.post('/file/createRequest', async (request, response) => {
        try {
            var fileContents = request.body.filecontents;
            var privateKey = request.body.privatekey;
            var repo = request.body.repo;
            var salt = crypto.randomBytes(16).toString('hex');

            var signature = await hash.SignMessage(privateKey, `${salt}${fileContents}${repo}`);
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
            var publicKey = request.body.publickey;
            var repo = request.body.repo;
            var salt = crypto.randomBytes(16).toString('hex');
            const encrypted = await crypto2.encrypt.rsa(fileContents, publicKey);
            var signature = await hash.SignMessage(privateKey, `${salt}${encrypted}${repo}`);
            response.send({ Success: true, Signature: signature, Salt: salt, Encrypted: encrypted });
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
            let memo = request.body.memo;

            blockLogger.WriteLog(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, fileContents, signature, publicKey, repo, memo);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //Submits the signed request.  Should be sent to an online computer.
    app.post('/file/submitRequestEncrypted', async (request, response) => {
        try {
            var filename = request.body.filename;
            var signature = request.body.signature;
            var publicKey = request.body.publickey;
            var repo = request.body.repo;
            var encrypted = request.body.encrypted;
            var salt = request.body.salt;
            let memo = request.body.memo;
            blockLogger.WriteLog(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, encrypted, signature, publicKey, repo, memo);
            response.send({ Success: true, Hash: result.hash });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    //Creates and submits a signed request.  Should be called on a secure node as private key is required. 
    app.post('/file/createSubmitRequest', async (request, response) => {
        try {
            debugger;
            var filename = request.body.filename;
            var fileContents = request.body.filecontents;
            var publicKey = request.body.publickey;
            var privateKey = request.body.privatekey;
            var repo = request.body.repo;
            let memo = request.body.memo;

            var salt = crypto.randomBytes(16).toString('hex');

            var signature = await hash.SignMessage(privateKey, `${salt}${fileContents}${repo}`);

            blockLogger.WriteLog(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, fileContents, signature, publicKey, repo, memo);
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
            let memo = request.body.memo;

            const encrypted = await crypto2.encrypt.rsa(fileContents, publicKey);
            var signature = await hash.SignMessage(privateKey, `${salt}${encrypted}${repo}`);

            blockLogger.WriteLog(`Received file ${filename}`);
            var result = await memPoolController.AddCodeFileToMemPool(filename, salt, encrypted, signature, publicKey, repo, memo);
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
                var fileContents = jsonQueryResult.value.fileData.fileContents;

                response.send({Success: true, FileContents: fileContents, FileName: jsonQueryResult.value.fileData.fileName,
                    Signature: jsonQueryResult.value.signature, DateAdded: jsonQueryResult.value.dateAdded, Salt: jsonQueryResult.value.salt,
                    Repo: jsonQueryResult.value.fileData.repo, Memo: jsonQueryResult.value.memo
                });
            } else {
                response.send({ Success: false, ErrorMessage: `File not found. Hash ${request.query.filehash}` });
            }
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.post('/file/getEncrypted', async (request, response) => {
        try {
            var block = await blockController.GetFileFromBlock(request.body.filehash);
            
            var privateKey = request.body.privatekey;
            console.log('hey private key is ', privateKey);
            if (block.length > 0) {
                var jsonQueryResult = jsonQuery('data[hash=' + request.body.filehash + ']', {
                    data: block
                });

                const decrypted = await crypto2.decrypt.rsa(jsonQueryResult.value.fileData.fileContents, privateKey);

                response.send({
                    Success: true, FileContents: decrypted, FileName: jsonQueryResult.value.fileData.fileName,
                    Signature: jsonQueryResult.value.signature, DateAdded: jsonQueryResult.value.dateAdded, Salt: jsonQueryResult.value.salt,
                    Repo: jsonQueryResult.value.fileData.repo, Memo: jsonQueryResult.value.memo
                });
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
            response.send({ Success: true, Hash: randomHash.toString('hex') });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getRepo', async (request, response) => {
        try {
            var repo = await blockController.GetRepoFromBlock(request.query.repohash);
            response.send({ Success: true, Repo: repo });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getRepoEncrypted', async (request, response) => {
        try {
            var privateKey = request.body.privatekey;
            var repo = await blockController.GetEncryptedRepoFromBlock(request.body.repohash, privateKey);
            response.send({ Success: true, Repo: repo });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });

    app.get('/file/getFileList', async (request, response) => {
        try {
            var files = await blockController.GetFilesByAddress(request.query.address);
            response.send({ Success: true, Files: files });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
    app.get('/file/getRepoList', async (request, response) => {
        try {
            var repo = await blockController.GetReposByAddress(request.query.address);
            response.send({ Success: true, Repos: repo });
        } catch (ex) {
            response.send({ Success: false, ErrorMessage: ex.toString() });
        }
    });
});


module.exports = {
    StartService
}