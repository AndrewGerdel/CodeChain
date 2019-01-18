var mongoose = require('../db/mongoose.js');
var mempoolItemTypes = require('../enums/mempoolFiletypes');
let jsonQuery = require('json-query')

mongoose.GetDb().then((db) => {
    db.collection("blocks").createIndex({ "data.type": 1, "data.transactionData.to": 1 }, { unique: false });
    db.collection("blocks").createIndex({ "data.type": 1, "data.transactionData.from": 1 }, { unique: false });
    db.collection("blocks").createIndex({ "data.type": 1, "data.publicKeyHash": 1 }, { unique: false });
});

//Queries the entire chain for FROM and TO transactions, as wll as mining rewards.  Sums and returns.  I suspect we will need a faster
//way to do this in the future, but to get us out of the gate this should probably suffice. 
var GetBalance = (async (publicKey) => {
    var start = new Date();
    var sumFrom = GetSumFrom(publicKey);
    var sumTo = GetSumTo(publicKey);
    var sumMining = GetMiningRewards(publicKey);
    var sumFromMempool = GetMempoolSumFrom(publicKey);
    var finalResult = [await sumFrom, await sumTo, await sumMining, await sumFromMempool];
    var end = new Date();

    console.log(`Total time: ${end - start}ms`);

    // console.log('finalSum ', finalResult[1] + finalResult[2] - finalResult[0] - finalResult[3]);
    return finalResult[1] + finalResult[2] - finalResult[0] - finalResult[3];
});

var GetSumFrom = (async (publicKey) => {
    //Get all blocks that contain a transaction FROM this address. Loop through the transactions within each block and sum just the ones from this address.
    var db = await mongoose.GetDb();
    var sum = 0;
    var blocks = await db.collection('blocks').find({ $and: [{ "data.type": mempoolItemTypes.Transaction }, { "data.transactionData.from": publicKey }] }).toArray();
    for (doc = 0; doc < blocks.length; doc++) {
        var documents = JSON.parse(JSON.stringify(blocks[doc]));
        for (dataCount = 0; dataCount < documents.data.length; dataCount++) {
            var data = JSON.parse(JSON.stringify(documents.data[dataCount]));
            if (data.transactionData && data.transactionData.from && data.transactionData.from == publicKey) {
                sum += data.transactionData.amount;
            }
        }
    }

    return sum;
});

var GetMempoolSumFrom = (async (publicKey) => {
    //Get all current memPoolItems from this address.  We don't need to worry about mempoolitems TO this address. We just want to be sure the sender isn't overspending.
    var db = await mongoose.GetDb();
    var sum = 0;
    var mempoolItems = await db.collection('mempools').find({ $and: [{ "type": mempoolItemTypes.Transaction }, { "transactionData.from": publicKey }] }).toArray();
    for (itemCount = 0; itemCount < mempoolItems.length; itemCount++) {
        var data = JSON.parse(JSON.stringify(mempoolItems[itemCount]));
        if (data.transactionData && data.transactionData.from && data.transactionData.from == publicKey) {
            sum += data.transactionData.amount;
        }
    }

    return sum;
});


var GetSumTo = (async (publicKey) => {
    //Get all blocks that contain a transaction TO this address. Loop through the transactions within each block and sum just the ones to this address.
    var db = await mongoose.GetDb();
    var sum = 0;
    var blocks = await db.collection('blocks').find({ $and: [{ "data.type": mempoolItemTypes.Transaction }, { "data.transactionData.to": publicKey }] }).toArray();
    for (doc = 0; doc < blocks.length; doc++) {
        var documents = JSON.parse(JSON.stringify(blocks[doc]));
        for (dataCount = 0; dataCount < documents.data.length; dataCount++) {
            var data = JSON.parse(JSON.stringify(documents.data[dataCount]));
            if (data.transactionData && data.transactionData.to && data.transactionData.to == publicKey) {
                sum += data.transactionData.amount;
            }
        }
    }
    return sum;
});

var GetMiningRewards = (async (publicKey) => {
    //Get all blocks that contain mining rewards for this address. 
    var db = await mongoose.GetDb();
    var sum = 0;
    var blocks = await db.collection('blocks').find({ $and: [{ "data.type": mempoolItemTypes.MiningReward }, { "data.publicKeyHash": publicKey }] }).toArray();
    for (doc = 0; doc < blocks.length; doc++) {
        var block = JSON.parse(JSON.stringify(blocks[doc]));
        for (dataCount = 0; dataCount < block.data.length; dataCount++) {
            var data = JSON.parse(JSON.stringify(block.data[dataCount]));
            if (data.type == mempoolItemTypes.MiningReward && data.publicKeyHash && data.publicKeyHash == publicKey) {
                sum += data.blockReward;
            }
        }
    }
    return sum;
});

module.exports = {
    GetBalance
}

// GetBalance("cc98c75e4432207cafd02b2d1e02e5fdd44f008aaa3818db00c1c96f189bfc27_y");
