var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');

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
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        console.log(`Received registration request from ${remoteProtocol}://${ip}:${remotePort}`);
        debugger;
        var hash = hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}`).toString('hex');
        nodeController.GetNode(hash)
            .then((result) => {
                debugger;
                if (result.length == 0) {
                    console.log(`Added remote node ${remoteProtocol}://${ip}:${remotePort}`)
                    nodeController.AddNode(remoteProtocol, ip, remotePort);
                }
            }, (err) => {
                res.send("Error:" + err);
            })
            .catch((ex) => {
                res.send("Exception:" + ex);
            });
    });

    var nodeList = LoadAndRegisterNodes();
});


var LoadAndRegisterNodes = (() => {
    nodeController.GetAllNodes()
        .then((nodes) => {
            console.log('Registering with', nodes.length, "nodes");
            nodeController.RegisterWithOtherNodes(nodes)
                .then((success) => {

                }, (fail) => {
                    console.log("crap i need to exit");
                });
        })
        .catch((ex) => {
            console.log(ex);
        })
});



module.exports = {
    StartService
}