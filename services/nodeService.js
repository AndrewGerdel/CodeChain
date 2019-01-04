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

    app.post('/addnode', (req, res) => {
        debugger;
        var uri = req.body.uri;
        nodeController.AddNode(uri)
            .then((resolve) => {
                debugger;
                res.send(resolve);
            }, (err) => {
                res.send(err);
            })
            .catch((ex) => {
                res.send(ex);
            });
    });

    LoadNodes();
});


var LoadNodes = (() => {
    nodeController.GetAllNodes().then((res1) => {
      console.log('Found nodes: ', res1.length);
        if(res1.length == 0){
            var nodeArrray = [];
            nodeArrray.push(nodeController.CreateDefaultNode());
            return nodeArrray;
        }else{
           return res1;
        }
    }, (err) => {
        console.log(err);
    })
    .catch((ex) => {
        console.log(ex);
    })
});

module.exports = {
    StartService
}