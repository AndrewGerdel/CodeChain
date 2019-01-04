var { Block } = require('../models/block.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var memPoolRepository = require('./mempoolRepository.js');
var connectionString = require('../config.json').database.connectionString;

var CreateNewBlock = ((hash, blockNumber, previousBlockHash, memPoolItems, millisecondsBlockTime) => {
    var newBlock = new Block({
        blockHash: hash,
        blockNumber: blockNumber,
        previousBlockHash: previousBlockHash,
        data: memPoolItems,
        millisecondsBlockTime: millisecondsBlockTime
    });
    newBlock.save();

    memPoolRepository.DeleteMemPoolItems(memPoolItems)
        .then((result) => { console.log('Cleared mempool items'); })
        .catch((error) => { console.log('Error clearing mempool', error); })

    return newBlock;
});


//Gets the most recent block from the chain
var GetLastBlock = (() => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString;
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db('CodeChain');
            var lastBlock = db.collection('blocks').find().sort({ blockNumber: -1 }).limit(1).toArray();
            resolve(lastBlock);
        });
    });
    return promise;
});

var GetFileFromBlock = ((filehash) => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString;
        console.log('constr is ', connectionString);
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db('CodeChain');
            var lastBlock = db.collection('blocks').find({ 'data.hash': filehash }).sort({ blockNumber: -1 }).limit(1).toArray();
            resolve(lastBlock);
        });
    });
    return promise;
});
module.exports = {
    CreateNewBlock,
    GetLastBlock,
    GetFileFromBlock
}