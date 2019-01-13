var mempoolController = require("../controllers/memPoolController.js");

var StartService = (async (app, isDebug) => {
    //This service is to be used to replicate mempoolItems between nodes.  Other services exist to allow end users to upload files, submit 
    //transactions, etc. This endpoint is only intended to be used for node-to-node communication.
    app.post('/mempool/add', async (request, response) => {
        var mempoolItem = JSON.parse(request.headers.mempoolitem);
        var mempoolItemFromDb = await mempoolController.GetMemPoolItem(mempoolItem.hash);
        if (mempoolItemFromDb.length > 0) {
            //this mempoolItem is already in our database.  Don't do anything.
        } else {
            try {
                if (mempoolItem.type == 1) {
                    await mempoolController.AddIncomingCodeFileToMemPool(mempoolItem);
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
