//controls interactions with other network nodes
var nodeRepository = require('../repositories/nodeRepository');
var request = require('request');
var config = require('../config.json');
var blockController = require('./blockController.js');
var requestPromise = require('request-promise');
var nodeProcessLog = require('../loggers/nodeProcessLog');

var LoadNodesFromPastebin = (async () => {
    var options = {
        uri: 'https://pastebin.com/raw/7Bvxz47q',
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };
    var result = await requestPromise(options);
    return result;
});

var GetAllNodes = (async () => {
    var nodes = await nodeRepository.GetAllNodes();

    if (nodes.length > 0) {
        return (nodes);
    } else {
        var nodesFromPasteBin = await LoadNodesFromPastebin();
        nodeProcessLog.WriteLog(`Retrieved ${nodesFromPasteBin.nodes.length} nodes from pastebin...`);
        for (n = 0; n < nodesFromPasteBin.nodes.length; n++) {
            nodeProcessLog.WriteLog(`Adding ${nodesFromPasteBin.nodes[n].uri}: ${nodesFromPasteBin.nodes[n].port}`);
            await nodeRepository.AddNode(nodesFromPasteBin.nodes[n].protocol, nodesFromPasteBin.nodes[n].uri, nodesFromPasteBin.nodes[n].port, nodesFromPasteBin.nodes[n].uid);
        }
        var newNodeList = await nodeRepository.GetAllNodesExludingMe();
        return (newNodeList);
    }
});

var GetAllNodesExludingMe = (async () => {
    var nodes = await nodeRepository.GetAllNodesExludingMe();
    return nodes;
});

var GetNode = (async (uid) => {
    var node = await nodeRepository.GetNode(uid);
    return node;
});

var AddNode = (async (protocol, uri, port, uid) => {
    var result = await nodeRepository.AddNode(protocol, uri, port, uid);
    return result;
});

var RegisterWithOtherNodes = (async (nodeList) => {
    nodeList.forEach(node => {
        var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/register';
        var options = {
            url: nodeRegisterEndPoint,
            method: 'POST',
            json: { remotePort: config.network.myPort, remoteProtocol: config.network.myProtocol, remoteUid: config.network.myUid }
        };
        var counter = 0;
        request(options, async (err, res, body) => {
            if (err) {
                nodeProcessLog.WriteLog(`Failed to register with ${node.protocol}://${node.uri}:${node.port}.  Error: ${err}`);
                nodeRepository.DeleteNode(node.hash);
            } else {
                try {
                    nodeProcessLog.WriteLog('Registered with ' + node.uri);
                    var returnData = JSON.parse(body);
                    var result = await nodeRepository.UpdateNodeRegistration(node, returnData);
                } catch (ex) {
                    nodeProcessLog.WriteLog(`Failed registration process with ${node.protocol}://${node.uri}:${node.port}. Deleting.  Exception: ${ex}`);
                    nodeRepository.DeleteNode(node.hash);
                }
            }
        });

    });
    return true;
});

var GetNodesFromRemoteNodes = (async (nodeList) => {
    nodeList.forEach(node => {
        if (node.blacklistUntilBlock && node.blacklistUntilBlock > 0)
            return;
        var nodeRegisterEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/get';
        request(nodeRegisterEndPoint, {}, (err, res, body) => {
            if (err) {
                nodeProcessLog.WriteLog(`Failed to get nodes from ${node.uri}:${node.port}, deleting`);
                nodeRepository.DeleteNode(node.hash);
            } else {
                try {
                    var nodesReceived = JSON.parse(body);
                    nodeProcessLog.WriteLog(`Received ${nodesReceived.length} nodes from ${node.uri}:${node.port}`);
                    nodesReceived.forEach(async (node) => {
                        nodeRepository.GetNode(node.uid)
                            .then((nodesFromDb) => {
                                if (nodesFromDb.length == 0) {
                                    nodeRepository.AddNode(node.protocol, node.uri, node.port, node.uid);
                                }
                            })
                    });
                } catch (error) {
                    nodeProcessLog.WriteLog('Deleting node '+ node.hash);
                    nodeRepository.DeleteNode(node.hash);
                }
            }
        });
    });
    return 'Requests sent to all nodes.';
});

var BroadcastBlockToNetwork = (async (block) => {
    var nodes = await GetAllNodesExludingMe();
    nodes.forEach((node) => {
        var postUrl = `${node.protocol}://${node.uri}:${node.port}/block/add`;
        var options = {
            url: postUrl,
            method: 'POST',
            json: { block: JSON.stringify(block), uid: config.network.myUid }
        };
        request(options, (err, res, body) => {
            if (err) {
                nodeProcessLog.WriteLog(`Failed to send block ${block.blockNumber} to node ${postUrl}.  Retrying...`);
                //Retry after three seconds.  Then delete the node if it fails again
                setTimeout(() => {
                    request(options, async (err2, res2, body2) => {
                        nodeProcessLog.WriteLog(`Second attempt failed to send block ${block.blockNumber} to node ${postUrl}.  Error: ${err}`);
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
        if (comparisonResult == true) {
            await GetBlocksFromRemoteNodeAndAppendToChain(node[0], lastBlock[0]);
        } else {
            //We are behind AND out of sync.  We have a collision.  If the other node's chain is ahead of ours, then accept his "rightness".  Orphan ours and merge his. 
            if (node[0].registrationDetails.blockHeight >= lastBlock[0].blockNumber + 1) {
                var lastMatchingBlockNumber = await FindWhereBlockchainsDiffer(node[0], lastBlock[0]);
                nodeProcessLog.WriteLog(`Orphaning all blocks after ${lastMatchingBlockNumber}`, true);
                await OrphanLocalBlocks(lastMatchingBlockNumber);
                //Now that the bad blocks have been removed, immediately get blocks from the longest node and append them, so we can become current again. 
                await GetBlocksFromRemoteNodeAndAppendToChain(node[0], lastBlock[0]);
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
        nodeProcessLog.WriteLog(`Received ${blocks.length} blocks from ${node.uri}:${node.port}`, true);
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
        nodeProcessLog.WriteLog(`Error pulling block from node ${node.uri}.  Deleting.  ${ex}`);
        nodeRepository.DeleteNode(node.hash);
    });

    if (blockHash == lastBlock.blockHash) {
        return true;
    } else {
        return false;
    }
});

var BlacklistNode = (async (node, blockHeight, lowBlock, highBlock) => {
    nodeRepository.BlacklistNode(node.uid, blockHeight + 5);
    var nodeEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/blacklistNotify';

    var options = {
        url: nodeEndPoint,
        method: 'POST',
        json: { uid: config.network.myUid, lowBlock: lowBlock, highBlock: highBlock }
    };
    request(options, async (err, res, body) => {
        if (err) {
            nodeProcessLog.WriteLog(`Failed to notify node ${node.uid} that we blacklisted them  Error: ${err}`);
        } else {
            //nothing to do on success
        }
    });

});


var UnBlacklistNode = (async (node, blockHeight) => {
    nodeRepository.UnBlacklistNode(node.uid);
    var nodeEndPoint = node.protocol + '://' + node.uri + ':' + node.port + '/nodes/unblacklistNotify';

    var options = {
        url: nodeEndPoint,
        method: 'POST',
        json: { uid: config.network.myUid }
    };
    request(options, async (err, res, body) => {
        if (err) {
            nodeProcessLog.WriteLog(`Failed to notify node ${node.uid} that we un-blacklisted them  Error: ${err}`);
        } else {
            //nothing to do on success
        }
    });

});


module.exports = {
    GetAllNodesExludingMe,
    AddNode,
    RegisterWithOtherNodes,
    GetNode,
    GetNodesFromRemoteNodes,
    BroadcastBlockToNetwork,
    ImportLongestBlockchain,
    GetAllNodes,
    BlacklistNode,
    UnBlacklistNode
}