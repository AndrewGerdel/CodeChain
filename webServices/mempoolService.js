var mempoolController = require("../controllers/memPoolController.js");
var mempoolItemTypes = require('../enums/mempoolFiletypes.js');

var StartService = (async (app, isDebug) => {
    //This service is to be used to replicate mempoolItems between nodes.  Other services exist to allow end users to upload files, submit 
    //transactions, etc. This endpoint is only intended to be used for node-to-node communication.
    app.post('/mempool/add', async (request, response) => {
        var mempoolItem = JSON.parse(request.headers.mempoolitem);

        var mempoolItemFromDb = await mempoolController.GetMemPoolItem(mempoolItem.hash);
        if (mempoolItemFromDb.length > 0) {
            //this mempoolItem is already in our database.  Don't do anything.
        } else {
            console.log(`Received memPoolItem ${mempoolItem.hash}`);
            try {
                if (mempoolItem.type == mempoolItemTypes.File) {
                    await mempoolController.AddIncomingCodeFileToMemPool(mempoolItem);
                }else if (mempoolItem.type == mempoolItemTypes.Transaction) {
                    throw new Error("Andrew, start here. Finish function below. Also create endpoint for submitting transaction.").
                    // todo
                    // await mempoolController.AddIncomingCodeFileToMemPool(mempoolItem);
                }
            } catch (ex) {
                //If it failed, it probably was a unique index vioation. Either another node already sent
                //this item, or it came thru with a solved block.
                response.send('Failed');
            }
        }
        response.send("ok");
    });
});

module.exports = {
    StartService
}
