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

var CreateDefaultNode = (() => {
    var defaultNodeUri = 'http://localhost:65340'; //Note: this is a temporary solution.  In the future, pull the default node from pastebin or some such
    nodeRepository.AddNode(defaultNodeUri)
        .then((res) => {
            return res;
        }, (err) => {
            throw new Error(err);
        })
        .catch((ex) => {
            throw new Error(ex);
        })
});

module.exports = {
    GetAllNodes,
    AddNode,
    CreateDefaultNode
}