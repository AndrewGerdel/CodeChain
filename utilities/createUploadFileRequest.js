var requestPromise = require('request-promise');

var CreateRequest = (async(url, filecontents, privatekey, repo) => {
    var promise = new Promise((resolve, reject) => {
        const data = JSON.stringify({
            filecontents: filecontents,
            privatekey: privatekey,
            repo: repo
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
    CreateRequest
}