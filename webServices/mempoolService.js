var StartService = (() => {
    //This service is to be used to replicate mempoolItems between nodes.  Other services exist to allow end users to upload files, submit 
    //transactions, etc. This endpoint is only intended to be used for node-to-node communication.
    app.post('/mempool/add', (request, response) => {
        var mempoolItem = request.body.mempoolitem;
        console.log(`Received mempool item ${mempoolItem}`);
    });
});
