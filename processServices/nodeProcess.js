var nodeController = require('../controllers/nodeController');
var config = require('../config.json');

Timer_LoadAndRegisterNodes();
setInterval(Timer_LoadAndRegisterNodes, config.timers.secondaryTimerIntervalMs);

function Timer_LoadAndRegisterNodes() {
    RegisterWithRemoteNodes()
        .then((results) => {
            UpdateNodeListFromRemoteNodes()
                .then((res2) => {
                    RetrieveBlockchainFromLongestNode()
                        .then((res3) => {

                        });
                })
        })
}

var RegisterWithRemoteNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeController.GetAllNodes() //get all nodes from our local db
            .then((nodes) => {
                console.log('Registering with', nodes.length, "nodes");
                nodeController.RegisterWithOtherNodes(nodes) //register with each of those nodes
                    .then((results) => {
                        resolve(results);
                    }, (err) => {
                        reject(err);
                    })
            });

    });
    return promise
});

var UpdateNodeListFromRemoteNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeController.GetAllNodes() //re-get all nodes from the db.  Some might have been deleted.
            .then((nodes2) => {
                nodeController.GetNodesFromRemoteNodes(nodes2) //get the nodelist from each remote node and import it into our db
                    .then((nodesFromRemote) => {
                        resolve(nodesFromRemote);
                    }, (err) => {
                        reject(err);
                    });
            });
    });
    return promise
});


var RetrieveBlockchainFromLongestNode = (() => {
    var promise = new Promise((resolve, reject) => {
        nodeController.GetLongestBlockchain()
            .then((longestNode) => {

            });
    });
    return promise
});
