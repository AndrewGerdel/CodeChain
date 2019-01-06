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
            var options = {
                url: nodeRegisterEndPoint,
                method: 'POST',
                headers: { remotePort: config.network.myPort, remoteProtocol: config.network.myProtocol }
            };
            var counter = 0;
            request(options, (err, res, body) => {
                if (err) {
                    console.log(`Failed to register with ${node.protocol}://${node.uri}:${node.port}.  Error: ${err}`);
                    //... or delete the node.  let's not delete the node.  Instead, just don't update the last registration datetime.  We'll clean them up later. 
                    nodeRepository.DeleteNode(node.hash)
                        .catch((ex) => { reject(`Failed to delete node ${node.uri}: ${ex}`); });
                } else {
                    console.log('Registered with', node.uri);
                    nodeRepository.UpdateNodeLastRegistrationDateTime(node)
                        .catch((ex) => { reject(`Failed to update node ${node.uri}: ${ex}`); });
                }
                counter++;
                if (counter >= nodeList.length) {
                    resolve(true);
                }
            });

        });
    });
    return promise;
});

var GetNodesFromRemoteNodes = ((nodeList) => {
    var promise = new Promise((resolve, reject) => {
        nodeList.forEach(node => {
            var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/get';
            request(nodeRegisterEndPoint, {}, (err, res, body) => {
                if (err) {
                    console.log(`Failed to get nodes from ${node.uri}:${node.port}, deleting`);
                    nodeRepository.DeleteNode(node.hash)
                        .then((result) => { })
                        .catch((ex) => { reject(`Failed to delete node ${node.uri}: ${ex}`); });
                } else {
                    try {
                        var nodesReceived = JSON.parse(body);
                        console.log(`Recieved ${nodesReceived.length} nodes from ${node.uri}:${node.port}`);
                        nodesReceived.forEach((node) => {
                            var hash = hashUtil.CreateSha256Hash(`${node.protocol}${node.uri}${node.port}`).toString('hex');
                            nodeRepository.GetNode(hash)
                                .then((nodesFromDb) => {
                                    if (nodesFromDb.length == 0) {
                                        nodeRepository.AddNode(node.protocol, node.uri, node.port);
                                    }
                                })
                        });
                    } catch (error) {
                        nodeRepository.DeleteNode(node.hash)
                            .catch((ex) => { reject(`Failed to delete node... ${node.uri}: ${ex}`); });
                        reject(error);
                    }
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
    GetNode,
    GetNodesFromRemoteNodes
}