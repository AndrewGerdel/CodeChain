//controls interactions with other network nodes
var nodeRepository = require('../repositories/nodeRepository');
var request = require('request');
var config = require('../config.json');
var hashUtil = require('../utilities/hash.js');
var blockController = require('./blockController.js');

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.GetAllNodes()
            .then((nodes) => {
                if (nodes.length > 0) {
                    resolve(nodes);
                } else {
                    // console.log('Adding default master node from config:', config.network.defaultMasterNode);
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
                    nodeRepository.DeleteNode(node.hash)
                        .catch((ex) => { reject(`Failed to delete node ${node.uri}: ${ex}`); });
                } else {
                    console.log('Registered with', node.uri);
                    try {
                        var returnData = JSON.parse(body);
                        nodeRepository.UpdateNodeRegistration(node, returnData)
                            .then((result) => {
                            })
                            .catch((ex) => { reject(`Failed to update node ${node.uri}: ${ex}`); });
                    } catch (ex) {
                        console.log(`Exception loading JSON from ${node.uri}:${node.port}. ${ex}`);
                    }
                }
            });
        });
        resolve('All requests launched');
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
        resolve('Requests sent to all nodes.');
    });
    return promise;
});

var BroadcastBlockToNetwork = ((block) => {
    GetAllNodes()
        .then((nodes) => {
            nodes.forEach((node) => {
                var postUrl = `${node.protocol}://${node.uri}:${node.port}/block/add`;
                var options = {
                    url: postUrl,
                    method: 'POST',
                    headers: { block: JSON.stringify(block) }
                };
                request(options, (err, res, body) => {
                    if (err) {
                        console.log(`Failed to send block ${block.BlockNumber} to node ${node.protocol}://${node.uri}:${node.port}.  Error: ${err}`);
                        //... or delete the node.  let's not delete the node.  Instead, just don't update the last registration datetime.  We'll clean them up later. 
                        nodeRepository.DeleteNode(node.hash)
                            .catch((ex) => { reject(`Failed to delete node after block submit failed ${node.uri}: ${ex}`); });
                    } else {
                        //it worked.  Nothing to report. 
                    }
                });
            });
        });
});

var GetLongestBlockchain = (() => {
    var promise = new Promise(async (resolve, reject) => {
        var lastBlock = await blockController.GetLastBlock();
        var node = await nodeRepository.GetNodeWithLongestChain();
        if (node.length > 0 && lastBlock.length > 0) {
            var blocks = await blockController.GetBlocksFromRemoteNode(node[0].hash, lastBlock[0].blockNumber);
            if (blocks.length > 0) {
                debugger;
                console.log(`I received ${blocks.length} blocks from ${node[0].uri}:${node[0].port}`);
                for (blockCount = 0; blockCount < blocks.length; blockCount++) {
                    var addblockResult = await blockController.ValidateAndAddBlock(blocks[blockCount]);
                    //Loop until that block is actually written to the database.  Otherwise validation of the next block will sometimes fail. 
                    do {
                        var lastBlockCheck = await blockController.GetLastBlock();
                    } while (lastBlockCheck[0].blockNumber < addblockResult.blockNumber);
                }
            }
        }
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode,
    RegisterWithOtherNodes,
    GetNode,
    GetNodesFromRemoteNodes,
    BroadcastBlockToNetwork,
    GetLongestBlockchain
}