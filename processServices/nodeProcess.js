var nodeController = require('../controllers/nodeController');
var config = require('../config.json');
var counter = 0;
process.on('unhandledRejection', (reason, promise) => {
    //console.log('Unhandled Rejection at:', reason.stack || reason)
});

var Timer_LoadAndRegisterNodes = (async () => {
    try {
        var res1 = await RegisterWithRemoteNodes();
        var res2 = await UpdateNodeListFromRemoteNodes();
        var res3 = await RetrieveBlockchainFromLongestNode();
        counter++;
        process.send({ iterationCount: counter });
    } catch (ex) {
        console.log(`Error in nodeProcess: ${ex}`);
    } finally {
        setTimeout(() => {
            Timer_LoadAndRegisterNodes();
        }, config.timers.secondaryTimerIntervalMs);
    }
});

var RegisterWithRemoteNodes = (async () => {
    var nodes = await nodeController.GetAllNodes();//.GetAllNodesExludingMe(); //get all nodes from our local db
    console.log(`Connected to ${nodes.length} nodes.`);

    // console.log('Registering with', nodes.length, "nodes");
    var registrationResults = await nodeController.RegisterWithOtherNodes(nodes) //register with each of those nodes
    return (registrationResults);
});

var UpdateNodeListFromRemoteNodes = (async () => {
    var nodes2 = await nodeController.GetAllNodesExludingMe(); //re-get all nodes from the db.  Some might have been deleted.
    var nodesFromRemote = await nodeController.GetNodesFromRemoteNodes(nodes2) //get the nodelist from each remote node and import it into our db
    return (nodesFromRemote);
});


var RetrieveBlockchainFromLongestNode = (async () => {
    //special case.  if running locally with a clean DB, we will be the only db on the network, and we have not yet (at startup) launched
    //the webservices.  So the call to ImportLongestBlockchain blows up, which then does not allow the webservices to start.  it's an ugly circle.
    //So if we're on the network alone, for any reason... don't try to import the longest blockchain.  It's pointless anyway. 
    var nodes = await nodeController.GetAllNodesExludingMe();
    if (!nodes || nodes.length <= 1) {
        return;
    } else {
        var longestNode = await nodeController.ImportLongestBlockchain((() => {
            return longestNode;
        }));
    }
});

console.log('Node process starting...');
Timer_LoadAndRegisterNodes();
