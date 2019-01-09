var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');
var blockController = require('../controllers/blockController');

var StartService = ((app, isDebug) => {
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


    if(isDebug) {
        //if debugging, do not run on it's own thread. 
        var nodeProcess = require('../processServices/nodeProcess.js');
      }else {
         //Run the backend block processes on a child thread
         const { fork } = require('child_process');
         const forked = fork('processServices/nodeProcess.js');
      }

 
    

});

module.exports = {
    StartService
}