var { MemPool } = require('../models/mempool.js');
var MemPoolController = require('./memPoolController.js');
var KeyController = require('./keyController.js');
var { Block } = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var nonce = 0;
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var request = require('request');

const maxBlockSizeBytes = 1000000;
var startingDifficulty = "0x000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Adds memPoolItems to the collection, then fires SolveBlock
function MineNextBlock() {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetLastBlock()
            .then((lastBlock) => {
                if (lastBlock.length == 0) {
                    //there are no blocks.  Create the genesis block.
                    var nonce = 0;
                    var effectiveDate = new Date('1/1/2000');
                    var mempoolItems = [];
                    var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems);
                    var hash = crypto.createHmac('sha256', hashInput).digest('hex');
                    var endingDateTime = new Date();
                    var millisecondsBlockTime = 0;
                    var newBlock = blockRepository.CreateNewBlock(hash, 0, 'None', mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString());
                    lastBlock.push(newBlock);
                }
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
                                .then((newBlock) => {
                                    resolve(newBlock);
                                }, (err) => {
                                    reject(err);
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
            var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems);
            var hash = crypto.createHmac('sha256', hashInput).digest('hex');

            var hashAsDecimal = hexToDec(hash);
            if (hashAsDecimal <= difficulty) {
                var endingDateTime = new Date();
                var millisecondsBlockTime = (endingDateTime - startingDateTime);
                var newBlock = blockRepository.CreateNewBlock(hash, previousBlock.blockNumber + 1, previousBlock.blockHash, mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString());
                resolve(newBlock);
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

function CreateBlockHash(nonce, effectiveDate, memPoolItems) {

    return hash;
}
//Converts all current memPoolItems to json for easy hashing.
function MemPoolItemsAsJson(memPoolItems) {
    var memPoolItemsJson = "";
    for (i = 0; i < memPoolItems.length; i++) {
        memPoolItemsJson += JSON.stringify(memPoolItems[i]);
    }
    return memPoolItemsJson;
}

var GetLastBlock = (() => {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetLastBlock()
            .then((block) => {
                resolve(block);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var GetBlocksFromStartingBlock = ((startingBlock) => {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetBlocksFromStartingBlock(startingBlock)
            .then((blocks) => {
                resolve(blocks);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});


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

var ValidateBlockHash = ((block) => {
    var promise = new Promise((resolve, reject) => {
        var hashInput = block.nonce + block.solvedDateTime + MemPoolItemsAsJson(block.data);
        var hash = crypto.createHmac('sha256', hashInput).digest('hex');
        if (hash == block.blockHash) {
            resolve(hash);
        } else {
            debugger;
            reject(hash);
        }
    });
    return promise;
});

var AddBlock = ((block) => {
    var promise = new Promise((resolve, reject) => {
        blockRepository.AddBlock(block)
            .then((result) => {
                resolve(result);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

//appends a collection of blocks to the existing blockchain.
var AppendBlockchain = ((blockchain) => {
    var promise = new Promise((resolve, reject) => {
        GetLastBlock()
            .then((lastBlockResult) => {
                var lastBlock = lastBlockResult[0];

            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var GetBlocksFromRemoteNode = ((nodeHash, startingBlockNumber) => {
    var promise = new Promise((resolve, reject) => {
        nodeRepository.GetNode(nodeHash)
            .then((nodeResult) => {
                var node = nodeResult[0];
                var getNodesUrl = `${node.protocol}://${node.uri}:${node.port}/block/getBlocks?startingBlock=${startingBlockNumber}`;
                request(getNodesUrl, (err, res, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        var blocks = JSON.parse(body);
                        resolve(blocks);
                    }
                });
            }, (err) => {
                reject('Could not find node ' + nodeHash);
            })
    });
    return promise;
});

var ValidateAndAddBlock = ((block) => {
    var promise = new Promise((resolve, reject) => {
        ValidateBlockHash(block)
            .then((result) => {
                console.log(`Successfully validated block hash ${block.blockNumber}`);
                GetLastBlock()
                    .then((lastBlock) => {
                        debugger;
                        if (block.blockNumber != lastBlock[0].blockNumber + 1) {
                            reject("Invalid block number");
                            // console.log("Invalid block number.", block.blockNumber, lastBlock[0].blockNumber);
                        } else {
                            if (block.previousBlockHash != lastBlock[0].blockHash) {
                                reject("Invalid previous block hash");
                                console.log("Invalid previous block hash.", previousBlockHash, lastBlock[0].blockHash);
                            } else {
                                AddBlock(block)
                                    .then((addBlockResult) => {
                                        resolve(`Successfully imported block ${block.blockNumber}`);
                                    }, (err) => {
                                        reject(`Error adding block to blockchain`);
                                        console.log(`Error adding block to blockchain. ${err}`);
                                    })

                            }
                        }
                    }, (err) => {
                        reject("Failed to retrieve last block");
                        console.log("Failed to retrieve last block.", err);
                    });
            }, (err) => {
                debugger;
                reject("Failed to validate block hash");
                console.log("Failed to validate block hash");
            });
    });
    return promise;


});

module.exports = {
    SolveBlock,
    MineNextBlock,
    GetFileFromBlock,
    ValidateBlockHash,
    GetLastBlock,
    AddBlock,
    GetBlocksFromStartingBlock,
    GetBlocksFromRemoteNode,
    ValidateAndAddBlock
}
