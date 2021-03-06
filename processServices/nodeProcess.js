var nodeController = require('../controllers/nodeController');
var config = require('../config.json');
var nodeProcessLog = require('../loggers/nodeProcessLog');
var nodeRepository = require('../repositories/nodeRepository');
var blockController = require('../controllers/blockController');
var request = require('request');
const timerIntervalMs = 30000;
const remoteValidationTimerIntervalMs = 60000;
var hash = require('../utilities/hash');

var counter = 0;
process.on('unhandledRejection', (reason, promise) => {
    nodeProcessLog.WriteLog('Error (unhandled rejection) in nodeProcess: ' + reason);
});

var Timer_LoadAndRegisterNodes = (async () => {
    try {
        if (process.env.DISABLENETWORKSYNC || (config.development && config.development.bypassNodeSync == true)) {
            //In development, in a single-node situation, bypass all the network sync logic.  It really creates problems.
            nodeProcessLog.WriteLog(`Disabling network sync.  Test mode.`, false);
            counter++;
            process.send({ iterationCount: counter });
        } else {
            nodeProcessLog.WriteLog("Registering with remote nodes.");
            var res1 = await RegisterWithRemoteNodes();
            nodeProcessLog.WriteLog("Updating node list from remote nodes.");
            var res2 = await UpdateNodeListFromRemoteNodes();
            nodeProcessLog.WriteLog("Pulling blockchain from the longest node.");
            var res3 = await RetrieveBlockchainFromLongestNode();
            counter++;
            process.send({ iterationCount: counter });
        }
    } catch (ex) {
        nodeProcessLog.WriteLog(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_LoadAndRegisterNodes();
        }, timerIntervalMs);
    }
});

var Timer_ValidateBlockChainsOfRemoteNodes = (async () => {
    try {
        var lastBlock = await blockController.GetLastBlock();
        if (!lastBlock || lastBlock.length == 0)
            return;
        var blockHeight = lastBlock[0].blockNumber
        var randomHigh = Math.trunc(Math.random() * ((blockHeight - 3) - (blockHeight / 2)) + (blockHeight / 2));  //Math.random() * (high-low) + low
        var randomLow = Math.trunc(Math.random() * ((((blockHeight) / 2) - 1) - 1) + 1); //Math.random() * (high-low) + low
        nodeProcessLog.WriteLog(`Random scanning blocks ${randomLow} to ${randomHigh}`);
        var myBlockHash = await blockController.GetBlockHashByRange(randomLow, randomHigh);
        var randomNodes = await nodeRepository.GetRandomNodes(10);
        randomNodes.forEach((node) => {
            var nodeEndpoint = `${node.protocol}://${node.uri}:${node.port}/nodes/calculateBlockchainHash?startingBlock=${randomLow}&endingBlock=${randomHigh}`;
            var options = {
                url: nodeEndpoint,
                method: 'GET',
            };
            request(options, async(err, res, body) => {
                if (err) {
                    nodeProcessLog.WriteLog(`Error testing random blocks on ${node.uid}: ${err}`);
                } else {
                    var bodyObj = JSON.parse(body);
                    if (bodyObj.Success == true) {
                        //Prepend the hash we generated from our blockchain with the nodes uid.  Hash that.  It should match what the remote node sent us.
                        var compareHash = await hash.CreateSha256Hash(`${node.uid}${myBlockHash}`);
                        if (bodyObj.Hash == compareHash.toString('hex')) {
                            nodeProcessLog.WriteLog(`Validated block ${randomLow} to ${randomHigh} with ${node.uid}`);
                        } else {
                            nodeProcessLog.WriteLog(`Failed to validate block ${randomLow} to ${randomHigh} with ${node.uid}. ${myBlockHash} vs. ${bodyObj.Hash}.  Blacklisting.`);
                            nodeController.BlacklistNode(node, blockHeight, randomLow, randomHigh);
                        }
                    } else {
                        nodeProcessLog.WriteLog(`Error testing random blocks on ${node.uid}: ${body}`);
                    }
                }
            });

        })
    } catch (ex) {
        nodeProcessLog.WriteLog(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_ValidateBlockChainsOfRemoteNodes();
        }, timerIntervalMs);
    }
});

var Timer_RevalidateBlockChainsOfBlacklistedNodes = (async () => {
    try {
        var blacklistedNodes = await nodeRepository.GetBlacklistedNodes();
        if (!blacklistedNodes || blacklistedNodes.length == 0) {
            return;
        }
        var lastBlock = await blockController.GetLastBlock();
        if (!lastBlock || lastBlock.length == 0)
            return;
        nodeProcessLog.WriteLog(`Attempting to un-blacklist ${blacklistedNodes.length} nodes.`);
        var blockHeight = lastBlock[0].blockNumber
        var randomHigh = blockHeight - 5;//before we un-blacklist, re-verify their entire chain... up to 5 blocks ago
        var randomLow = 1;//before we un-blacklist, re-verify their entire chain..
        var myBlockHash = await blockController.GetBlockHashByRange(randomLow, randomHigh);
        blacklistedNodes.forEach((node) => {
            var nodeEndpoint = `${node.protocol}://${node.uri}:${node.port}/nodes/calculateBlockchainHash?startingBlock=${randomLow}&endingBlock=${randomHigh}`;
            var options = {
                url: nodeEndpoint,
                method: 'GET',
            };
            request(options, (err, res, body) => {
                if (err) {
                    nodeProcessLog.WriteLog(`Error testing (un-blacklist) random blocks on ${node.uid}: ${err}`);
                } else {
                    var bodyObj = JSON.parse(body);
                    if (bodyObj.Success == true) {
                        //Prepend the hash we generated from our blockchain with the nodes uid.  Hash that.  It should match what the remote node sent us.
                        var compareHash = hash.CreateSha256Hash(`${node.uid}${myBlockHash}`);
                        if (bodyObj.Hash == compareHash) {
                            nodeProcessLog.WriteLog(`Validated block ${randomLow} to ${randomHigh} with ${node.uid}. Un-blacklisting node.`);
                            nodeController.UnBlacklistNode(node, blockHeight);
                        } else {
                            nodeProcessLog.WriteLog(`Failed to validate block ${randomLow} to ${randomHigh} with ${node.uid}. ${myBlockHash} vs. ${bodyObj.Hash}.  Will remain blacklisted.`);
                        }
                    } else {
                        nodeProcessLog.WriteLog(`Error (un-blacklisting) testing random blocks on ${node.uid}: ${body}`);
                    }
                }
            });

        })
    } catch (ex) {
        nodeProcessLog.WriteLog(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_RevalidateBlockChainsOfBlacklistedNodes();
        }, remoteValidationTimerIntervalMs);
    }
});

var RegisterWithRemoteNodes = (async () => {
    var nodes = await nodeController.GetAllNodes();//.GetAllNodesExludingMe(); //get all nodes from our local db
    nodeProcessLog.WriteLog(`Connected to ${nodes.length} nodes.`);
    var registrationResults = await nodeController.RegisterWithOtherNodes(nodes) //register with each of those nodes
    return (registrationResults);
});

var UpdateNodeListFromRemoteNodes = (async () => {
    var nodes2 = await nodeController.GetAllNodesExludingMe(); //re-get all nodes from the db.  Some might have been deleted.
    var nodesFromRemote = await nodeController.GetNodesFromRemoteNodes(nodes2) //get the nodelist from each remote node and import it into our db
    return (nodesFromRemote);
});


var RetrieveBlockchainFromLongestNode = (async () => {
    var nodes = await nodeController.GetAllNodesExludingMe();
    if (!nodes || nodes.length < 1) {
        return;
    } else {
        var longestNode = await nodeController.ImportLongestBlockchain();
        return longestNode;
    }
});

nodeProcessLog.WriteLog('Node process starting...', true);
Timer_LoadAndRegisterNodes();
Timer_ValidateBlockChainsOfRemoteNodes();
Timer_RevalidateBlockChainsOfBlacklistedNodes();
