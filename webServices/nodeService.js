var nodeController = require('../controllers/nodeController');
var hashUtil = require('../utilities/hash.js');
var blockController = require('../controllers/blockController');
var nodeLogger = require('../loggers/nodeProcessLog');
var config = require('../config.json');

var StartService = ((app, isDebug, callback) => {

    app.get('/nodes/get', (req, res) => {
        nodeController.GetAllNodesExludingMe()
            .then((resolve) => {
                res.send(resolve);
            }, (error) => {
                res.send(error);
            })
            .catch((ex) => {
                nodeLogger.WriteLog(ex);
            })
    });

    app.post('/nodes/register', async (req, res) => {
        debugger;
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.body.remotePort
        var remoteProtocol = req.body.remoteProtocol;
        var remoteUid = req.body.remoteUid;
        var hash = await hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}${remoteUid}`);
        nodeController.GetNode(remoteUid)
            .then((result) => {
                if (result.length == 0) {
                    nodeController.AddNode(remoteProtocol, ip, remotePort, remoteUid);
                    nodeLogger.WriteLog(`Added remote node ${remoteProtocol}://${ip}:${remotePort}`)
                } else {

                }
                blockController.GetLastBlock().then((result) => {
                    if (result.length > 0) {
                        var responseDetails = { yourHash: hash.toString('hex'), myBlockHeight: result[0].blockNumber }
                        res.send(responseDetails);
                    } else {
                        res.send('No blocks found');
                    }
                }, (err) => {
                    nodeLogger.WriteLog(`Error getting last block. ${err}`);
                    res.send(`Unknown error getting blockchain on remote host.`);
                });

            }, (err) => {
                res.send("Error:" + err);
            })
            .catch((ex) => {
                res.send("Exception:" + ex);
            });
    });

    app.get('/nodes/whoami', async (req, res) => {
        var ip = req.ip;
        ip = ip.replace('::ffff:', ''); //for localhost debugging.
        var remotePort = req.headers.remoteport
        var remoteProtocol = req.headers.remoteprotocol;
        var hash = await hashUtil.CreateSha256Hash(`${remoteProtocol}${ip}${remotePort}`);
        res.send(hash.toString('hex'));
    });

    app.get('/nodes/calculateBlockchainHash', async (req, res) => {
        try {
            var startingBlock = req.query.startingBlock;
            var endingBlock = req.query.endingBlock;
            var hashResult = await blockController.GetBlockHashByRange(startingBlock, endingBlock);
            //Now prepend the hashResult with MY node UID.  To prevent bad actors from simply bouncing this call off another node and echoing the response.
            var finalResult = await hashUtil.CreateSha256Hash(`${config.network.myUid}${hashResult.toString('hex')}`);
            res.send({ Success: true, Hash: finalResult.toString('hex') });

        } catch (ex) {
            res.send({ Success: false, ErrorMessage: ex.toString() });
        }

    });

    app.post('/nodes/blacklistNotify', async (req, res) => {
        var remoteNodeUid = req.body.uid;
        var lowBlock = req.body.lowBlock;
        var highBlock = req.body.highBlock;

        blockController.ValidateLocalBlockchain(lowBlock, highBlock);

        nodeLogger.WriteLog('Warning: You have been blacklisted by ' + remoteNodeUid, true);
        res.send({ Success: true });
    });


    app.post('/nodes/unblacklistNotify', async (req, res) => {
        var remoteNodeUid = req.body.uid;
        nodeLogger.WriteLog('Notice: You have been un-blacklisted by ' + remoteNodeUid, true);
        res.send({ Success: true });
    });


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