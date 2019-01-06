var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');
var config = require('../config.json');

var StartService = ((app) => {
    app.get('/nodes/get', (req, res) => {
        nodeController.GetAllNodes()
            .then((resolve) => {
                res.send(resolve);
            }, (error) => {
                console.log(error);
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
                res.send("Done");
            }, (err) => {
                res.send("Error:" + err);
            })
            .catch((ex) => {
                res.send("Exception:" + ex);
            });
    });

    LoadAndRegisterNodes();
    setInterval(Timer_LoadAndRegisterNodes, config.timers.secondaryTimerIntervalMs);

});



function Timer_LoadAndRegisterNodes() {
    LoadAndRegisterNodes();
}


var LoadAndRegisterNodes = (() => {
    nodeController.GetAllNodes()
        .then((nodes) => {
            console.log('Registering with', nodes.length, "nodes");
            nodeController.RegisterWithOtherNodes(nodes)
                .then((success) => {
                    nodeController.GetNodesFromRemoteNodes(nodes)
                        .then((nodesFromRemote) => {

                        }).catch((ex) => {
                            console.log(ex);
                        });
                }).catch((ex) => {
                    console.log(ex);
                });
        })
        .catch((ex) => {
            console.log(ex);
        })
});



module.exports = {
    StartService
}