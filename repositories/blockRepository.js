var { Block } = require('../models/block.js');
var mongoose = require('../db/mongoose.js');
var memPoolRepository = require('./mempoolRepository.js');

mongoose.GetDb().then((db) => {
    db.collection("blocks").createIndex({ "blockNumber": 1 }, { unique: true });
    db.collection("blocks").createIndex({ "blockHash": 1 }, { unique: true });
    db.collection("blocks").createIndex({ "previousBlockHash": 1 }, { unique: true });
    db.collection("blocks").createIndex({ "data.hash": 1 }, { unique: true });
});

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
        .then((result) => {
            // console.log(`Cleared ${memPoolItems.length} mempool items`); 
        })
        .catch((error) => { console.log('Error clearing mempool', error); })

    return newBlock;
});

var AddBlock = (async (block) => {
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

    return newBlock;
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

var MoveBlocksToOrphanCollection = (async (blocks) => {
    if (blocks.length > 0) {
        var db = await mongoose.GetDb();
        await db.collection('orphanedBlocks').insertMany(blocks).catch((ex) => {
            console.log('Failed to add blocks to orphanedBlocks. Error: ' + ex); //shouldn't the error be caught/logged without this?
            throw new Error('Failed to add blocks to orphanedBlocks: ' + ex);
        });
        for (i = 0; i < blocks.length; i++) {
            db.collection('blocks').deleteOne({ _id: blocks[i]._id }).catch((ex) => {
                console.log('Failed to remove orphaned block.  Error: ' + ex);
                throw new Error('Failed to remove orphaned block: ' + ex);
            })
        }
    }
});

var GetBalance = (async(publicKey) => {
    console.log(`!!!!!ANDREW, finish this code`);
    
    return 100;
    // var db = await mongoose.GetDb();
    // var blocks = await db.getCollection('blocks').find(
    //     { $and :[ 
    //         {"data.type": 4}, 
    //         {"data.blockReward": 50}   
    //     ]})
    });

    

module.exports = {
    CreateNewBlock,
    GetLastBlock,
    GetFileFromBlock,
    AddBlock,
    GetBlocksFromStartingBlock,
    GetBlocks,
    GetBlock,
    GetBlockHashesFromStartingBlock,
    MoveBlocksToOrphanCollection,
    GetBalance
}