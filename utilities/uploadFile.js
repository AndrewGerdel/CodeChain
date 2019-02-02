var requestPromise = require('request-promise');

var UploadFile = (async (baseUrl, filename, filecontents, publickey, privatekey) => {

    var promise = new Promise((resolve, reject) => {
        const data = JSON.stringify({
            filename: filename,
            filecontents: filecontents,
            publickey: publickey,
            privatekey: privatekey
        });

        const options = {
            uri: `${baseUrl}/file/createSubmitRequest`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            body: data
        }

        requestPromise(options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    return promise;
});

var CreateRequest = (async (baseUrl, filecontents, privatekey) => {
    var promise = new Promise((resolve, reject) => {
        try {
            const data = JSON.stringify({
                filecontents: filecontents,
                privatekey: privatekey
            });
            const options = {
                uri: `${baseUrl}/file/createRequest`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
                body: data
            }
            requestPromise(options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        } catch (ex) {
            console.log('error' + ex);

            reject(ex);
        }
    });
    return promise;
});

var SubmitRequest = (async (baseUrl, filename, signature, publickey, filecontents, salt, memo) => {
    var promise = new Promise((resolve, reject) => {
        try {
            const data = JSON.stringify({
                filename: filename,
                signature: signature,
                publickey: publickey,
                filecontents: filecontents,
                salt: salt,
                memo: memo
            });
            const options = {
                uri: `${baseUrl}/file/submitRequest`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
                body: data
            }
            requestPromise(options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        } catch (ex) {
            console.log('error' + ex);

            reject(ex);
        }
    });
    return promise;
});

var CreateEncryptedRequest = (async (baseUrl, filecontents, privatekey, publickey) => {
    var promise = new Promise((resolve, reject) => {
        try {
            const data = JSON.stringify({
                filecontents: filecontents,
                privatekey: privatekey,
                publickey: publickey
            });
            const options = {
                uri: `${baseUrl}/file/createEncryptedRequest`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
                body: data
            }
            requestPromise(options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        } catch (ex) {
            console.log('error' + ex);

            reject(ex);
        }
    });
    return promise;
});


var SubmitEncryptedRequest = (async (baseUrl, filename, signature, publickey, filecontents, salt, memo) => {
    var promise = new Promise((resolve, reject) => {
        try {

            const data = JSON.stringify({
                filename: filename,
                signature: signature,
                publickey: publickey,
                filecontents: filecontents,
                salt: salt,
                memo: memo
            });
            const options = {
                uri: `${baseUrl}/file/submitRequestEncrypted`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
                body: data
            }
            requestPromise(options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        } catch (ex) {
            console.log('error' + ex);

            reject(ex);
        }
    });
    return promise;
});


module.exports = {
    UploadFile,
    CreateRequest,
    CreateEncryptedRequest,
    SubmitRequest,
    SubmitEncryptedRequest
}