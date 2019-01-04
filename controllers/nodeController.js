//controls interactions with other network nodes
var nodeRepository = require('../repositories/nodeRepository');

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.GetAllNodes()
            .then((res) => {
                resolve(res);
            }, (err) => {
                reject('An error occurred: ' + err);
            })
            .catch((ex) => {
                reject(ex);
            });
    });
    return promise;
});

var AddNode = ((uri) => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.AddNode(uri)
            .then((res) => {
                resolve(res);
            }, (error) => {
                reject('An error occurred:' + error);
            })
            .catch((ex) => {
                reject(ex);
            });
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode
}