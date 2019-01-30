var requestPromise = require('request-promise');

var UploadFile = (async(url, filename, filecontents, publickey, privatekey) => {

    var promise = new Promise((resolve, reject) => {
        const data = JSON.stringify({
            filename: filename,
            filecontents: filecontents,
            publickey: publickey,
            privatekey: privatekey
        });
        
        const options = {
            uri: url,
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

module.exports = {
    UploadFile
}