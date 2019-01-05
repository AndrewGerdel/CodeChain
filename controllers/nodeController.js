//controls interactions with other network nodes
var nodeRepository = require('../repositories/nodeRepository');
var request = require('request');
var config = require('../config.json');
var hashUtil = require('../utilities/hash.js');

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.GetAllNodes()
            .then((nodes) => {
                if (nodes.length > 0) {
                    resolve(nodes);
                } else {
                    console.log('Adding default master node from config:', config.network.defaultMasterNode);
                    nodeRepository.AddNode(config.network.defaultMasterNodeProtocol, config.network.defaultMasterNode, config.network.defaultMasterNodePort)
                        .then((newNode) => {
                            nodeRepository.GetAllNodes()
                                .then((newNodeList) => {
                                    resolve(newNodeList);
                                })
                        });
                }
            }, (err) => {
                reject('An error occurred: ' + err);
            })
            .catch((ex) => {
                reject(ex);
            });
    });
    return promise;
});

var GetNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.GetNode(hash)
            .then((node) => {
                resolve(node);
            }, (err) => {
                reject('An error occurred: ' + err);
            })
            .catch((ex) => {
                reject(ex);
            });
    });
    return promise;
});

var AddNode = ((protocol, uri, port) => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.AddNode(protocol, uri, port)
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

var RegisterWithOtherNodes = ((nodeList) => {
    var promise = new Promise((resolve, reject) => {

        nodeList.forEach(node => {
            var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/register';
            request(nodeRegisterEndPoint, { remotePort: config.network.myPort, remoteProtocol: config.network.myProtocol }, (err, res, body) => {
                if (err) {
                    console.log(`Failed to register with ${node.uri}, deleting`);
                    nodeRepository.DeleteNode(node)
                        .catch((ex) => { reject(`Failed to delete node ${node.uri}: ${ex}`); });
                } else {
                    console.log('Registered with', node.uri);
                    nodeRepository.UpdateNodeLastRegistrationDateTime(node)
                        .catch((ex) => { reject(`Failed to update node ${node.uri}: ${ex}`); });
                }
            });
        });
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode,
    RegisterWithOtherNodes,
    GetNode
}