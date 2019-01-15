var nodeController = require('../controllers/nodeController');
var config = require('../config.json');
var nodeProcessLog = require('../loggers/nodeProcessLog');

var counter = 0;
process.on('unhandledRejection', (reason, promise) => {
    console.log('Error (unhandled rejection) in nodeProcess: ', reason);
});

var Timer_LoadAndRegisterNodes = (async () => {
    try {
        nodeProcessLog.WriteLog("Registering with remote nodes.");
        var res1 = await RegisterWithRemoteNodes();
        nodeProcessLog.WriteLog("Updating node list from remote nodes.");
        var res2 = await UpdateNodeListFromRemoteNodes();
        nodeProcessLog.WriteLog("Pulling blockchain from the longest node.");
        var res3 = await RetrieveBlockchainFromLongestNode();
        counter++;
        process.send({ iterationCount: counter });
    } catch (ex) {
        nodeProcessLog.WriteLog(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_LoadAndRegisterNodes();
        }, config.timers.secondaryTimerIntervalMs);
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

console.log('Node process starting...');
Timer_LoadAndRegisterNodes();
