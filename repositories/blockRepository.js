var { Block } = require('../models/block.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var memPoolRepository = require('./mempoolRepository.js');
var connectionString = require('../config.json').database;

var CreateNewBlock = ((hash, blockNumber, previousBlockHash, memPoolItems, millisecondsBlockTime, nonce, solvedDateTime, difficulty) => {
    var newBlock = new Block({
        blockHash: hash,
        blockNumber: blockNumber,
        previousBlockHash: previousBlockHash,
        data: memPoolItems,
        millisecondsBlockTime: millisecondsBlockTime,
        nonce: nonce,
        solvedDateTime: solvedDateTime,
        difficulty: difficulty
    });
    newBlock.save();

    memPoolRepository.DeleteMemPoolItems(memPoolItems)
        .then((result) => { console.log(`Cleared ${memPoolItems.length} mempool items`); })
        .catch((error) => { console.log('Error clearing mempool', error); })

    return newBlock;
});

var AddBlock = ((block) => {
    var promise = new Promise((resolve, reject) => {
        var newBlock = new Block({
            blockHash: block.blockHash,
            blockNumber: block.blockNumber,
            previousBlockHash: block.previousBlockHash,
            data: block.data,
            millisecondsBlockTime: block.millisecondsBlockTime,
            nonce: block.nonce,
            solvedDateTime: block.solvedDateTime,
            difficulty: block.difficulty
        });
        newBlock.save();

        memPoolRepository.DeleteMemPoolItems(block.data)
            .then((result) => { console.log(`Cleared ${block.data.length} mempool items`); })
            .catch((error) => { console.log('Error clearing mempool', error); })

        resolve(newBlock);
    });
    return promise;

});

//Gets the most recent block from the chain
var GetBlocks = ((blockCount) => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString.host;
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var lastBlock = db.collection('blocks').find().sort({ blockNumber: -1 }).limit(blockCount).toArray();
            client.close();
            resolve(lastBlock);
        });
    });
    return promise;
});

//Gets the most recent block from the chain
var GetLastBlock = (() => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString.host;
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var lastBlock = db.collection('blocks').find().sort({ blockNumber: -1 }).limit(1).toArray();
            client.close();
            resolve(lastBlock);
        });
    });
    return promise;
});

//Gets the most recent block from the chain
var GetBlock = ((blockNumber) => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString.host;
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo:', error);
                return;
            }
            var db = client.db(connectionString.database);
            var lastBlock = db.collection('blocks').find({ blockNumber: blockNumber }).toArray();
            // client.close();
            resolve(lastBlock);
        });
    });
    return promise;
});

var GetBlocksFromStartingBlock = ((startingBlock) => {
    var promise = new Promise((resolve, reject) => {
        var url = connectionString.host;
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var blocks = db.collection('blocks').find({ "blockNumber": { "$gt": Number(startingBlock) } }).sort({ blockNumber: 1 }).toArray();
            client.close();
            resolve(blocks);
        });
    });
    return promise;
});

var GetFileFromBlock = ((filehash) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var lastBlock = db.collection('blocks').find({ 'data.hash': filehash }).sort({ blockNumber: -1 }).limit(1).toArray();
            client.close();
            resolve(lastBlock);
        });
    });
    return promise;
});
module.exports = {
    CreateNewBlock,
    GetLastBlock,
    GetFileFromBlock,
    AddBlock,
    GetBlocksFromStartingBlock,
    GetBlocks,
    GetBlock
}