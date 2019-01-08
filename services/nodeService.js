var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');
var config = require('../config.json');
var blockController = require('../controllers/blockController');

var StartService = ((app) => {
    app.get('/nodes/get', (req, res) => {
        nodeController.GetAllNodes()
            .then((resolve) => {
                res.send(resolve);
            }, (error) => {
                res.send(error);
            })
            .catch((ex) => {
                console.log(ex);
            })
    });

    app.post('/nodes/register', (req, res) => {
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        console.log(`Received registration request from ${remoteProtocol}://${ip}:${remotePort}`);
        var hash = hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}`).toString('hex');
        nodeController.GetNode(hash)
            .then((result) => {
                if (result.length == 0) {
                    nodeController.AddNode(remoteProtocol, ip, remotePort);
                    console.log(`Added remote node ${remoteProtocol}://${ip}:${remotePort}`)
                } else {
                    // console.log('I didnt add the registration because that node already exists');
                }
                blockController.GetLastBlock().then((result) => {
                    var responseDetails = { yourHash: hash, myBlockHeight: result[0].blockNumber }
                    res.send(responseDetails);
                }, (err) => {
                    console.log(`Error getting last block. ${err}`);
                    res.send(`Unknown error getting blockchain on remote host.`);
                });

            }, (err) => {
                res.send("Error:" + err);
            })
            .catch((ex) => {
                res.send("Exception:" + ex);
            });
    });

    app.get('/nodes/whoami', (req, res) => {
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        var hash = hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}`).toString('hex');
        res.send(hash);
    });

    Timer_LoadAndRegisterNodes();
    setInterval(Timer_LoadAndRegisterNodes, config.timers.secondaryTimerIntervalMs);

});

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

module.exports = {
    StartService
}