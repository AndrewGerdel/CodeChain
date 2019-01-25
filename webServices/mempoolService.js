var mempoolController = require("../controllers/memPoolController.js");
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');
var blockLogger = require('../loggers/blockProcessLog');

var StartService = (async (app, isDebug) => {
    //This service is to be used to replicate mempoolItems between nodes.  Other services exist to allow end users to upload files, submit 
    //transactions, etc. This endpoint is only intended to be used for node-to-node communication.
    app.post('/mempool/add', async (request, response) => {
        var mempoolItem = JSON.parse(request.body.mempoolItem);
        var remoteNodeUid = request.body.uid;

        var mempoolItemFromDb = await mempoolController.GetMemPoolItem(mempoolItem.hash);
        if (mempoolItemFromDb.length > 0) {
            //this mempoolItem is already in our database.  Don't do anything.
        } else {
            blockLogger.WriteLog(`Received memPoolItem ${mempoolItem.hash}`);
            try {
                if (mempoolItem.type == mempoolItemTypes.File) {
                    await mempoolController.AddIncomingCodeFileToMemPool(mempoolItem, remoteNodeUid);
                } else if (mempoolItem.type == mempoolItemTypes.Transaction) {
                    await mempoolController.AddIncomingTransactionToMemPool(mempoolItem, remoteNodeUid);
                } else if (mempoolItem.type == mempoolItemTypes.Message) {
                    await mempoolController.AddIncomingMessageToMemPool(mempoolItem, remoteNodeUid);
                }
                response.send("ok");
            } catch (ex) {
                //If it failed, it probably was a unique index vioation. Either another node already sent
                //this item, or it came thru with a solved block.
                blockLogger.WriteLog(`Error in mempool/add: ${ex}`);
                response.send('Failed');
            }
        }
    });
});

module.exports = {
    StartService
}
