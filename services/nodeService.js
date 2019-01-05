var nodeController = require('../controllers/nodeController');

var StartService = ((app) => {
    app.get('/nodes', (req, res) => {
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

    app.post('/register', (req, res) => {
        var ip = req.iq;
        debugger;
        var remotePort = req.remotePort;
        var remoteProtocol = req.remoteProtocol;
        nodeController.GetNode(ip)
            .then((result) => {
                if (result.length == 0) {
                    nodeController.AddNode(remoteProtocol, ip);
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