var { MemPool } = require('../models/mempool.js');
var MemPoolController = require('./memPoolController.js');
var KeyController = require('./keyController.js');
var { Block } = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var decToHex = require('dec-to-hex');
var nonce = 0;
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var request = require('request');
var config = require('../config.json');
var pad = require('pad-left');

const maxBlockSizeBytes = 1000000;
const targetBlockTimeMs = config.network.targetBlockTimeMs; //target a one minute block time. 

// Adds memPoolItems to the collection, then fires SolveBlock
function MineNextBlock() {
    var promise = new Promise((resolve, reject) => {
        debugger;

        memPoolRepository.GetMemPoolItems()
            .then((memPoolItemsFromDb) => {
                debugger;
                if (memPoolItemsFromDb.length > 0) {
                    blockRepository.GetLastBlock()
                        .then((lastBlock) => {
                            CreateGenesisBlock(lastBlock) //will create a genesis block if the chain is currently empty.
                                .then((lastBlock) => {
                                    CalculateDifficulty(lastBlock) //calculates the difficulty for the next block. 
                                        .then((difficulty) => {
                                            BreakMemPoolItemsToSize(memPoolItemsFromDb, difficulty, lastBlock)
                                                .then((a) => {
                                                    resolve(a);
                                                }, (err) => {
                                                    reject(err); //err from BreakMemPoolItemsToSize
                                                });
                                        }, (err) => {
                                            reject(err); //err from CalculateDifficulty
                                        });
                                }, (err) => {
                                    reject(err); //err from CreateGenesisBlock
                                })
                        }, (err) => {
                            reject(err); //err from getlastblock
                        })
                        .catch((ex) => {
                            throw new Error(ex);
                        })
                }else{
                    reject(""); //no work to do
                }
            });
    });
    return promise;
}

var BreakMemPoolItemsToSize = ((memPoolItemsFromDb, difficulty, lastBlock) => {
    var promise = new Promise((resolve, reject) => {
        var sumFileSizeBytes = 0;
        var counter = 0;
        var memPoolItems = [];
        if (memPoolItemsFromDb.length == 0) {
            reject(""); //no work to do, reject silently.
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
            SolveBlock(difficulty, lastBlock[0], memPoolItems)
                .then((newBlock) => {
                    resolve(newBlock);
                }, (err) => {
                    reject(err);
                })
                .catch((error) => {
                    reject('Error in GetMemPoolItems: ' + error);
                });
        }
    });
    return promise;
});

var CreateGenesisBlock = ((lastBlock) => {
    var promise = new Promise((resolve, reject) => {
        if (lastBlock.length == 0) {
            var nonce = 0;
            var effectiveDate = new Date('1/1/2000');
            var mempoolItems = [];
            var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems);
            var hash = crypto.createHmac('sha256', hashInput).digest('hex');
            var endingDateTime = new Date();
            var millisecondsBlockTime = targetBlockTimeMs - 1000; //one second slower than target
            var genesisDifficulty = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            var newBlock = blockRepository.CreateNewBlock(hash, 0, 'None', mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString(), genesisDifficulty);
            lastBlock.push(newBlock);
            resolve(lastBlock);
        } else {
            resolve(lastBlock);
        }
    });
    return promise;
});

var CalculateDifficulty = ((lastBlock) => {
    var promise = new Promise((resolve, reject) => {
        debugger;

        blockRepository.GetBlocks(10).then((result) => {
            var totalMilliseconds = 0;
            for (i = 0; i < result.length; i++) {
                totalMilliseconds += result[i].millisecondsBlockTime;
            }
            var averageBlockTimeMs = totalMilliseconds / result.length;
            if (averageBlockTimeMs < targetBlockTimeMs) {
                var diff = targetBlockTimeMs - averageBlockTimeMs;
                var percentage = (diff / targetBlockTimeMs);
                var currentDifficulty = hexToDec(lastBlock[0].difficulty);
                var newDifficulty = currentDifficulty - (currentDifficulty * percentage);
                resolve(newDifficulty);
            }
            else if (averageBlockTimeMs > targetBlockTimeMs) {
                var diff = averageBlockTimeMs - targetBlockTimeMs;
                var percentage = (diff / targetBlockTimeMs);
                var currentDifficulty = hexToDec(lastBlock[0].difficulty);
                var newDifficulty = currentDifficulty + (currentDifficulty * percentage);
                resolve(newDifficulty);
            }
            else if (averageBlockTimeMs == targetBlockTimeMs) {
                resolve(hexToDec(lastBlock[0].difficulty));
            }
        }, (err) => {
            reject(err);
        });
    });
    return promise;
});


function DifficultyAsHumanReadable(difficulty) {
    var difficultyAsHexString = decToHex(difficulty).toString("hex");
    // console.log(`as hex string ${difficultyAsHexString}`);
    return 80 - difficultyAsHexString.length;
}
//Hashes the current mempool items along with a nonce and datetime until below supplied difficulty.
var SolveBlock = ((difficulty, previousBlock, mempoolItems) => {
    var promise = new Promise((resolve, reject) => {
        let targetBlockNumber = previousBlock.blockNumber + 1;
        console.log(`Difficulty calculated at ${DifficultyAsHumanReadable(difficulty)}LZ. Working on block ${targetBlockNumber}.`);

        var startingDateTime = new Date();
        var effectiveDate = new Date();
        var counter = 0;
        do {
            counter++;
            if (counter == 50000) {
                counter = 0;
                blockRepository.GetBlock(targetBlockNumber)
                    .then((block) => {
                        if (block.length > 0) {
                            reject(`Abandoning block ${targetBlockNumber}. `)
                        }
                    });
            }
            var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems) + decToHex(difficulty);
            var hash = crypto.createHmac('sha256', hashInput).digest('hex');

            var hashAsDecimal = hexToDec(hash);
            if (hashAsDecimal <= difficulty) {
                var endingDateTime = new Date();
                var millisecondsBlockTime = (endingDateTime - startingDateTime);
                var newBlock = blockRepository.CreateNewBlock(hash, targetBlockNumber, previousBlock.blockHash, mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString(), decToHex(difficulty));
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
        var hashInput = block.nonce + block.solvedDateTime + MemPoolItemsAsJson(block.data) + block.difficulty;
        var hash = crypto.createHmac('sha256', hashInput).digest('hex');
        if (hash == block.blockHash) {
            resolve(hash);
        } else {
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
        ValidateBlockHash(block) //validate the block hash (nonce, solvedDateTime and MemPoolItems)
            .then((result) => {
                console.log(`Successfully validated block hash ${block.blockNumber}`);
                MemPoolController.ValidateMemPoolItems(block.data) //validate each memPoolItem (filecontents, signedmessage, publickey)
                    .then((result) => {
                        console.log(`Successfully validated memPoolItems on block ${block.blockNumber}`);
                        GetLastBlock() //Get the last block from my local db
                            .then((lastBlock) => {
                                if (block.blockNumber != lastBlock[0].blockNumber + 1) { //Make sure the last blocknumber is one less than the blocknumber being added
                                    reject("Invalid block number");
                                } else {
                                    if (block.previousBlockHash != lastBlock[0].blockHash) { //Make sure the block of the previous hash matches the previousBlockHash of the block being added.
                                        console.log("Invalid previous block hash.", block.previousBlockHash, lastBlock[0].blockHash);
                                        reject("Invalid previous block hash");
                                    } else {
                                        AddBlock(block) //Finally... all validations passed.  Add the block to the end of the chain. 
                                            .then((addBlockResult) => {
                                                resolve(`Successfully imported block ${block.blockNumber}`);
                                            }, (err) => {
                                                console.log(`Error adding block to blockchain. ${err}`);
                                                reject(`Error adding block to blockchain`);
                                            });
                                    }
                                }
                            }, (err) => {
                                console.log("Failed to retrieve last block.", err);
                                reject("Failed to retrieve last block");
                            });
                    }, (err) => {
                        console.log("Failed to validate memPoolItems.", err);
                        reject("Failed to validate memPoolItems.");
                    });
            }, (err) => {
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
