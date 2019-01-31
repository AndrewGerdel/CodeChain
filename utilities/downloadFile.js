var request = require('request');

var DownloadFile = ((uri, filehash) => {
    var promise = new Promise((resolve, reject) => {
        request(uri + '?filehash=' + filehash, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                // var bodyObj = JSON.parse(body);
                resolve(body);
            }
        });
    });
    return promise;
});

module.exports = {
    DownloadFile
}
