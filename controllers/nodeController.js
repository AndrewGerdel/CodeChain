//controls interactions with other network nodes
var nodeRepository = require('../repositories/nodeRepository');
var request = require('request');
var requestPromise = require('request-promise');
var config = require('../config.json');
var hashUtil = require('../utilities/hash.js');
var blockController = require('./blockController.js');

var GetAllNodesExludingMe = (() => {
    var promise = new Promise(async (resolve, reject) => {
        var nodes = await nodeRepository.GetAllNodesExludingMe();
        resolve(nodes);
    });
    return promise;
});

var GetAllNodes = (async () => {
    var nodes = await nodeRepository.GetAllNodes();

    if (nodes.length > 0) {
        return (nodes);
    } else {
        // console.log('Adding default master node from config:', config.network.defaultMasterNode);
        var newNode = await nodeRepository.AddNode(config.network.defaultMasterNodeProtocol, config.network.defaultMasterNode, config.network.defaultMasterNodePort, config.network.defaultMasterNodeUid);
        var newNodeList = await nodeRepository.GetAllNodesExludingMe();
        return (newNodeList);
    }
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

var AddNode = ((protocol, uri, port, uid) => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.AddNode(protocol, uri, port, uid)
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

var RegisterWithOtherNodes = (async (nodeList) => {
    nodeList.forEach(node => {

        var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/register';
        var options = {
            url: nodeRegisterEndPoint,
            method: 'POST',
            headers: { remotePort: config.network.myPort, remoteProtocol: config.network.myProtocol, remoteUid: config.network.myUid }
        };
        var counter = 0;
        request(options, async (err, res, body) => {
            if (err) {
                // console.log(`Failed to register with ${node.protocol}://${node.uri}:${node.port}.  Error: ${err}`);
                nodeRepository.DeleteNode(node.hash);
            } else {
                try {
                    // console.log('Registered with', node.uri);
                    var returnData = JSON.parse(body);
                    var result = await nodeRepository.UpdateNodeRegistration(node, returnData);
                } catch (ex) {
                    console.log(`Failed registration process with ${node.protocol}://${node.uri}:${node.port}. Deleting.  Exception: ${ex}`);
                    nodeRepository.DeleteNode(node.hash);
                }
            }
        });

    });
    return true;
});

var GetNodesFromRemoteNodes = ((nodeList) => {
    var promise = new Promise((resolve, reject) => {
        nodeList.forEach(node => {
            var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/get';
            request(nodeRegisterEndPoint, {}, (err, res, body) => {
                if (err) {
                    // console.log(`Failed to get nodes from ${node.uri}:${node.port}, deleting`);
                    nodeRepository.DeleteNode(node.hash)
                        .then((result) => { })
                        .catch((ex) => { reject(`Failed to delete node ${node.uri}: ${ex}`); });
                } else {
                    try {
                        var nodesReceived = JSON.parse(body);
                        // console.log(`Received ${nodesReceived.length} nodes from ${node.uri}:${node.port}`);
                        nodesReceived.forEach(async (node) => {
                            var hash = await hashUtil.CreateSha256Hash(`${node.protocol}${node.uri}${node.port}${node.uid}`);
                            nodeRepository.GetNode(hash.toString('hex'))
                                .then((nodesFromDb) => {
                                    if (nodesFromDb.length == 0) {
                                        nodeRepository.AddNode(node.protocol, node.uri, node.port, node.uid);
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
var BroadcastBlockToNetwork = (async(block) => {
    var nodes = await GetAllNodesExludingMe();
    nodes.forEach((node) => {
        var postUrl = `${node.protocol}://${node.uri}:${node.port}/block/add`;
        var options = {
            url: postUrl,
            method: 'POST',
            headers: { block: JSON.stringify(block) }
        };
        request(options, (err, res, body) => {
            if (err) {
                console.log(`Failed to send block ${block.blockNumber} to node ${node.protocol}://${node.uri}:${node.port}.  Retrying...`);
                //Retry after three seconds.  Then delete the node if it fails again
                setTimeout(() => {
                    request(options, async (err2, res2, body2) => {
                        //... or delete the node.  let's not delete the node.  Instead, just don't update the last registration datetime.  We'll clean them up later. 
                        console.log(`Second attempt failed to send block ${block.blockNumber} to node ${node.protocol}://${node.uri}:${node.port}.  Error: ${err}`);
                        nodeRepository.DeleteNode(node.hash);
                    });
                }, 3000);
            } else {
                //it worked.  Nothing to report. 
            }
        });
    });
});

var ImportLongestBlockchain = (async () => {
    var lastBlock = await blockController.GetLastBlock();
    if (!lastBlock || lastBlock.length == 0) {
        lastBlock = await blockController.CreateGenesisBlock();
    }
    if (lastBlock && lastBlock.length > 0) {
        blockNumber = lastBlock[0].blockNumber;
    }
    var node = await nodeRepository.GetNodeWithLongestChain();
    if (node && node.length > 0) {
        //We are behind at least one node on the network.   But how far behind? And do we have any collisions?
        //1: Compare our most recent block to the other node's same block.  Are we a match?
        var comparisonResult = await CompareOurMostRecentBlock(node[0], lastBlock[0]);
        if (comparisonResult) {
            GetBlocksFromRemoteNodeAndAppendToChain(node[0], lastBlock[0]);
        } else {
            //We are behind AND out of sync.  We have a collision.  If the other node's chain is SIX BLOCKS OR MORE ahead of ours, then 
            //accept his "rightness".  Orphan ours and merge his. 
            if (node[0].registrationDetails.blockHeight >= lastBlock[0].blockNumber + 6) {
                var lastMatchingBlockNumber = await FindWhereBlockchainsDiffer(node[0], lastBlock[0]);
                console.log(`Orphaning all blocks after ${lastMatchingBlockNumber}`);
                console.log(1);
                
                await OrphanLocalBlocks(lastMatchingBlockNumber);
                console.log(2);
                //Now that the bad blocks have been removed, immediately get blocks from the longest node and append them, so we can become current again. 
                GetBlocksFromRemoteNodeAndAppendToChain(node[0], lastBlock[0]);
                console.log(3);
            }
        }
    }
});

var OrphanLocalBlocks = (async (lastMatchingBlockNumber) => {
    var blocks = await blockController.GetBlocksFromStartingBlock(lastMatchingBlockNumber);
    await blockController.OrphanBlocks(blocks);
});

var FindWhereBlockchainsDiffer = (async (node, lastBlock) => {
    var lastMatchingBlockNumber = 0;
    for (blockNumber = lastBlock.blockNumber; blockNumber > 0; blockNumber--) {
        var myLocalBlock = await blockController.GetBlock(blockNumber);
        var remoteBlockHash = await GetBlockHashFromRemoteNode(node, blockNumber);
        if (myLocalBlock && myLocalBlock.length > 0 && myLocalBlock[0].blockHash == remoteBlockHash) {
            lastMatchingBlockNumber = blockNumber;
            break;
        }
    }
    return lastMatchingBlockNumber;
});

var GetBlocksFromRemoteNodeAndAppendToChain = (async (node, lastBlock) => {
    var blocks = await GetBlocksFromRemoteNode(node, lastBlock.blockNumber);
    if (blocks && blocks.length > 0) {
        console.log(`I received ${blocks.length} blocks from ${node.uri}:${node.port}`);
        for (blockCount = 0; blockCount < blocks.length; blockCount++) {

            var addblockResult = await blockController.ValidateAndAddIncomingBlock(blocks[blockCount]);
            //Loop until that block is actually written to the database.  Otherwise validation of the next block will sometimes fail. 
            do {
                var lastBlockCheck = await blockController.GetLastBlock();
            } while (lastBlockCheck[0].blockNumber < addblockResult.blockNumber);
        }
    }
});

var GetBlocksFromRemoteNode = (async (node, startingBlockNumber) => {
    var getNodesUrl = `${node.protocol}://${node.uri}:${node.port}/block/getBlocks?startingBlock=${startingBlockNumber}`;
    var body = await requestPromise(getNodesUrl).catch((ex) => {
        throw new Error(`Could not get blocks from remote node ${node.uri}.  ${ex}`);
    });
    var blocks = JSON.parse(body);
    return (blocks);
});

var GetBlockHashFromRemoteNode = (async (node, blockNumber) => {
    var getNodesUrl = `${node.protocol}://${node.uri}:${node.port}/block/getBlockHash?blockNumber=${blockNumber}`;
    var body = await requestPromise(getNodesUrl).catch((ex) => {
        throw new Error(`Could not get block hash from remote node ${node.uri}.  ${ex}`);
    });
    return (body);
});

var CompareOurMostRecentBlock = (async (node, lastBlock) => {

    var getNodesUrl = `${node.protocol}://${node.uri}:${node.port}/block/getBlockHash?blockNumber=${lastBlock.blockNumber}`;
    var blockHash = await requestPromise(getNodesUrl).catch((ex) => {
        throw new Error(`Error pulling block from node ${node.uri}. ${ex}`);
    });

    if (blockHash == lastBlock.blockHash) {
        return true;
    } else {
        // console.log(`Our hash for block ${lastBlock.blockNumber} is ${lastBlock.blockHash}. Theirs is ${blockHash}`);
        return false;
    }
});




module.exports = {
    GetAllNodesExludingMe,
    AddNode,
    RegisterWithOtherNodes,
    GetNode,
    GetNodesFromRemoteNodes,
    BroadcastBlockToNetwork,
    ImportLongestBlockchain,
    GetAllNodes
}