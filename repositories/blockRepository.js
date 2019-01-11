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
        mongoose.GetDb()
            .then((db) => {
                var lastBlock = db.collection('blocks').find().sort({ blockNumber: -1 }).limit(blockCount).toArray();
                resolve(lastBlock);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

//Gets the most recent block from the chain
var GetLastBlock = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var lastBlock = db.collection('blocks').find().sort({ blockNumber: -1 }).limit(1).toArray();
                resolve(lastBlock);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

//Gets the a block from the chain
var GetBlock = (async (blockNumber) => {
    var db = await mongoose.GetDb();
    var lastBlock = db.collection('blocks').find({ blockNumber: blockNumber }).toArray();
    return lastBlock;
});

var GetBlocksFromStartingBlock = ((startingBlock) => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var blocks = db.collection('blocks').find({ "blockNumber": { "$gt": Number(startingBlock) } }).sort({ blockNumber: 1 }).toArray();
                resolve(blocks);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});


var GetBlockHashesFromStartingBlock = ((startingBlock) => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var blocks = db.collection('blocks').find({ "blockNumber": { "$gt": Number(startingBlock) } }, { blockNumber: 1, blockHash: 1 }).sort({ blockNumber: 1 }).toArray();
                resolve(blocks);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var GetFileFromBlock = ((filehash) => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var lastBlock = db.collection('blocks').find({ 'data.hash': filehash }).sort({ blockNumber: -1 }).limit(1).toArray();
                resolve(lastBlock);
            }, (err) => {
                reject(err);
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
    GetBlock,
    GetBlockHashesFromStartingBlock
}