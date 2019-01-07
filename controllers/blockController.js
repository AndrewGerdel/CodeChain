var { MemPool } = require('../models/mempool.js');
var MemPoolController = require('./memPoolController.js');
var KeyController = require('./keyController.js');
var { Block } = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var nonce = 0;
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');

const maxBlockSizeBytes = 1000000;
var startingDifficulty = "0x000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Adds memPoolItems to the collection, then fires SolveBlock
function MineNextBlock() {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetLastBlock()
            .then((lastBlock) => {
                if (lastBlock.length == 0) {
                    //there are no blocks.  Create the genesis block.
                    var newBlock = blockRepository.CreateNewBlock('68f64f11fdcb97cdc5b4f52726cf923e6d3bc6f41f153ce91b7532221fa48fd7', 1, 'None', [], 0, 0, new Date());
                    lastBlock.push(newBlock);
                }
                // console.log('the last block is:', lastBlock[0].blockNumber);
                memPoolRepository.GetMemPoolItems()
                    .then((memPoolItemsFromDb) => {
                        var sumFileSizeBytes = 0;
                        var counter = 0;
                        var memPoolItems = [];
                        if (memPoolItemsFromDb.length == 0) {
                            reject("Empty mempool");
                        }
                        else {
                            console.log('MempoolItems found:', memPoolItemsFromDb.length, 'Working on them now...');
                            for (i = 0; i < memPoolItemsFromDb.length; i++) {
                                var element = memPoolItemsFromDb[i];
                                var fileSizeBytes = (element.fileData.fileContents.length * 0.75) - 2;
                                sumFileSizeBytes += fileSizeBytes;
                                memPoolItems.push(memPoolItemsFromDb[i]);
                                // console.log(element._id, "File name:", element.fileName,  "File Size:", fileSizeBytes);
                                if (sumFileSizeBytes >= maxBlockSizeBytes) {
                                    break;
                                }
                            }//endfor
                            SolveBlock(hexToDec(startingDifficulty), lastBlock[0], memPoolItems)
                                .then((hashResult) => {
                                    // console.log(hashResult);
                                    resolve(hashResult);
                                })
                                .catch((error) => {
                                    reject('Error in GetMemPoolItems: ' + error);
                                });
                        }
                    })
                    .catch((error) => { throw new Error(error); });
            }, (err) => {
                throw new Error(err);
            })
            .catch((ex) => {
                throw new Error(ex);
            })
    });
    return promise;
}

//Hashes the current mempool items along with a nonce and datetime until below supplied difficulty.
var SolveBlock = ((difficulty, previousBlock, mempoolItems) => {
    var promise = new Promise((resolve, reject) => {
        var startingDateTime = new Date();
        var effectiveDate = new Date();
        do {
            var hash = crypto.createHmac('sha256', nonce + effectiveDate + MemPoolItemsAsJson(mempoolItems)).digest('hex');
            var hashAsDecimal = hexToDec(hash);
            if (hashAsDecimal <= difficulty) {
                var endingDateTime = new Date();
                var millisecondsBlockTime = (endingDateTime - startingDateTime);
                var newBlock = blockRepository.CreateNewBlock(hash, previousBlock.blockNumber + 1, previousBlock.blockHash, mempoolItems, millisecondsBlockTime, nonce, effectiveDate);
                resolve({ Block: newBlock });
            }
            nonce++;
            if (nonce >= Number.MAX_SAFE_INTEGER) {
                nonce = 0;
                effectiveDate = new Date();
            }
        } while (hashAsDecimal > difficulty)
    });
    return promise;
});

//Converts all current memPoolItems to json for easy hashing.
function MemPoolItemsAsJson(memPoolItems) {
    var memPoolItemsJson;
    for (i = 0; i < memPoolItems.length; i++) {
        memPoolItemsJson += JSON.stringify(memPoolItems[i]);
    }
    return memPoolItemsJson;
}

var GetFileFromBlock = ((filehash) => {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetFileFromBlock(filehash)
            .then((res) => {
                resolve(res);
            }, (err) => {
                reject(err);
            })
            .catch((ex) => {
                reject(ex);
            })
    });
    return promise;
});

var ValidateBlock = ((block) => {
    var promise = new Promise((resolve, reject) => {
        // KeyController.VerifySignedMessage()
        debugger;
    });
});

module.exports = {
    SolveBlock,
    MineNextBlock,
    GetFileFromBlock,
    ValidateBlock
}
