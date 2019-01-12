var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');
var blockController = require('../controllers/blockController');

var StartService = ((app, isDebug, callback) => {
    console.log(1.1);

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
    console.log(1.1);

    app.post('/nodes/register', (req, res) => {
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        // console.log(`Received registration request from ${remoteProtocol}://${ip}:${remotePort}`);
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
                    if (result.length > 0) {
                        var responseDetails = { yourHash: hash, myBlockHeight: result[0].blockNumber }
                        res.send(responseDetails);
                    } else {
                        res.send('No blocks found');
                    }
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
    console.log(1.1);

    app.get('/nodes/whoami', (req, res) => {
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        var hash = hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}`).toString('hex');
        res.send(hash);
    });

    console.log(1.2);

    if (isDebug) {
        //Run the backend block processes on a child thread with inspect-brk
        //NOTE: In chrome, 'Open dedicated DevTools for Node'.  Add localhost:7778 and localhost:7779

        const { fork } = require('child_process');
        const forked = fork('processServices/nodeProcess.js', [], { execArgv: ['--inspect-brk=7778'] });

        //if we're debugging, just fire up all services right out of the gate.  Don't wait for the network to sync.
        callback();

        // forked.on('message', (msg) => {
        //     if (msg && msg.iterationCount == 1) {
        //         //only callback on the first iteration.  This will fire up all the webservice endpoints.
        //     }
        // });
    } else {
        //Run the backend block processes on a child thread
        const { fork } = require('child_process');
        const forked = fork('processServices/nodeProcess.js');
        forked.on('message', (msg) => {
            if (msg && msg.iterationCount == 1) {
                //only callback on the first iteration.  This will fire up all the webservice endpoints.
                callback();
            }
        });
    }
});

module.exports = {
    StartService
}