var requestPromise = require('request-promise');
var request = require('request');

var DownloadFile = ((baseUrl, filehash) => {
    var promise = new Promise((resolve, reject) => {
        request(`${baseUrl}/file/get?filehash=${filehash}`, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    return promise;
});

var DownloadEncryptedFile = ((baseUrl, filehash, privatekey) => {

    var promise = new Promise((resolve, reject) => {
        try {

            const data = JSON.stringify({
                privatekey: privatekey,
                filehash: filehash
            });
            const options = {
                uri: `${baseUrl}/file/getEncrypted`,
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

var DownloadRepo = ((baseUrl, repoHash) => {
    var promise = new Promise((resolve, reject) => {
        request(`${baseUrl}/file/getRepo?repohash=${repoHash}`, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    return promise;
});

var DownloadRepoEncrypted = ((baseUrl, repohash, privatekey) => {
    var promise = new Promise((resolve, reject) => {
        const data = JSON.stringify({
            privatekey: privatekey,
            repohash: repohash
        });
        const options = {
            uri: `${baseUrl}/file/getRepoEncrypted`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
            body: data
        }
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    return promise;
});


module.exports = {
    DownloadFile,
    DownloadEncryptedFile, 
    DownloadRepo,
    DownloadRepoEncrypted
}
