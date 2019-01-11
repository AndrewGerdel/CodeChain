var nodeController = require('../controllers/nodeController');
var config = require('../config.json');

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
});

var Timer_LoadAndRegisterNodes = (async () => {
    // console.log('nodeProcess running.', new Date());

    try {
        var res1 = await RegisterWithRemoteNodes();
        var res2 = await UpdateNodeListFromRemoteNodes();
        var res3 = await RetrieveBlockchainFromLongestNode();
    } catch (ex) {
        console.log(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_LoadAndRegisterNodes();
        }, config.timers.secondaryTimerIntervalMs);
    }
});

var RegisterWithRemoteNodes = (async () => {
    var nodes = await nodeController.GetAllNodes(); //get all nodes from our local db
    console.log(`Connected to ${nodes.length} nodes.`);
    
    // console.log('Registering with', nodes.length, "nodes");
    var registrationResults = await nodeController.RegisterWithOtherNodes(nodes) //register with each of those nodes
    return (registrationResults);
});

var UpdateNodeListFromRemoteNodes = (async () => {
    var nodes2 = await nodeController.GetAllNodes(); //re-get all nodes from the db.  Some might have been deleted.
    var nodesFromRemote = await nodeController.GetNodesFromRemoteNodes(nodes2) //get the nodelist from each remote node and import it into our db
    return (nodesFromRemote);
});


var RetrieveBlockchainFromLongestNode = (async() => {
    var longestNode = await nodeController.ImportLongestBlockchain((() => {
        return longestNode;
    }));
});

console.log('Node process starting...');
Timer_LoadAndRegisterNodes();
