var StartService = (() => {
    app.post('/mempool/add', (request, response) => {
        var mempoolItem = request.body.mempoolitem;
        console.log(`Received mempool item ${mempoolItem}`);
    });
});
