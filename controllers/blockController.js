var { MemPool } = require('../models/mempool.js');
var MemPoolController = require('./memPoolController.js');
var { Block } = require('../models/block.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var decToHex = require('dec-to-hex');
var nonce = 0;
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');
var nodeRepository = require('../repositories/nodeRepository.js');
var request = require('request');
var requestPromise = require('request-promise');
var config = require('../config.json');
var pad = require('pad-left');

const maxBlockSizeBytes = 1000000;
const targetBlockTimeMs = config.network.targetBlockTimeMs; //target a one minute block time. 

// Adds memPoolItems to the collection, then fires SolveBlock
async function MineNextBlock() {
    var memPoolItemsFromDb = await memPoolRepository.GetMemPoolItems();
    if (memPoolItemsFromDb.length > 0) {
        var lastBlock = await blockRepository.GetLastBlock();
        lastBlock = await CreateGenesisBlock(lastBlock);
        var difficulty = await CalculateDifficulty(lastBlock);
        return await BreakMemPoolItemsToSize(memPoolItemsFromDb, difficulty, lastBlock)
    }
}

var BreakMemPoolItemsToSize = (async (memPoolItemsFromDb, difficulty, lastBlock) => {
    var sumFileSizeBytes = 0;
    var counter = 0;
    var memPoolItems = [];
    if (memPoolItemsFromDb.length == 0) {
        return "";
    }
    else {
        console.log('MempoolItems found:', memPoolItemsFromDb.length, 'Working on them now...');
        for (i = 0; i < memPoolItemsFromDb.length; i++) {
            var element = memPoolItemsFromDb[i];
            var fileSizeBytes = (element.fileData.fileContents.length * 0.75) - 2;
            sumFileSizeBytes += fileSizeBytes;
            memPoolItems.push(memPoolItemsFromDb[i]);
            if (sumFileSizeBytes >= maxBlockSizeBytes) {
                break;
            }
        }//endfor
        var newBlock = await SolveBlock(difficulty, lastBlock[0], memPoolItems);
        return newBlock;
    }
});

var CreateGenesisBlock = ((lastBlock) => {
    var promise = new Promise((resolve, reject) => {
        if (!lastBlock || lastBlock.length == 0) {
            lastBlock = [];
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

var CalculateDifficulty = (async (lastBlock) => {
    var result = await blockRepository.GetBlocks(10);
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
        return (newDifficulty);
    }
    else if (averageBlockTimeMs > targetBlockTimeMs) {
        var diff = averageBlockTimeMs - targetBlockTimeMs;
        var percentage = (diff / targetBlockTimeMs);
        var currentDifficulty = hexToDec(lastBlock[0].difficulty);
        var newDifficulty = currentDifficulty + (currentDifficulty * percentage);
        return (newDifficulty);
    }
    else if (averageBlockTimeMs == targetBlockTimeMs) {
        return (hexToDec(lastBlock[0].difficulty));
    }
});


function DifficultyAsHumanReadable(difficulty) {
    var difficultyAsHexString = decToHex(difficulty).toString("hex");
    // console.log(`as hex string ${difficultyAsHexString}`);
    return 80 - difficultyAsHexString.length;
}
//Hashes the current mempool items along with a nonce and datetime until below supplied difficulty.
var SolveBlock = (async (difficulty, previousBlock, mempoolItems) => {
    let targetBlockNumber = previousBlock.blockNumber + 1;
    console.log(`Difficulty calculated at ${DifficultyAsHumanReadable(difficulty)}LZ. Working on block ${targetBlockNumber}.`);

    var startingDateTime = new Date();
    var effectiveDate = new Date();
    var counter = 0;
    do {
        counter++;
        if (counter >= 50000) {
            counter = 0;
            var block = await blockRepository.GetBlock(targetBlockNumber);
            if (block.length > 0) {
                console.log(`Abandoning work on block ${targetBlockNumber}. Block solved by another node.`);
                return;
            }
        }
        var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems) + decToHex(difficulty);
        var hash = crypto.createHmac('sha256', hashInput).digest('hex');

        var hashAsDecimal = hexToDec(hash);
        if (hashAsDecimal <= difficulty) {
            var endingDateTime = new Date();
            var millisecondsBlockTime = (endingDateTime - startingDateTime);
            var newBlock = await blockRepository.CreateNewBlock(hash, targetBlockNumber, previousBlock.blockHash, mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString(), decToHex(difficulty));
            return newBlock;
        }
        nonce++;
        if (nonce >= Number.MAX_SAFE_INTEGER) {
            nonce = 0;
            effectiveDate = new Date();
        }
    } while (hashAsDecimal > difficulty)
});

//Converts all current memPoolItems to json for easy hashing.
function MemPoolItemsAsJson(memPoolItems) {
    var memPoolItemsJson = "";
    for (i = 0; i < memPoolItems.length; i++) {
        memPoolItemsJson += JSON.stringify(memPoolItems[i]);
    }
    return memPoolItemsJson;
}

var GetLastBlock = (async () => {
    var block = await blockRepository.GetLastBlock();
    return block;
});

var GetBlock = (async (blockNumber) => {
    var block = await blockRepository.GetBlock(blockNumber);
    return block;
});

var GetBlockHash = (async (blockNumber) => {
    var block = await blockRepository.GetBlock(blockNumber);
    if (block && block.length > 0) {
        return block[0].blockHash;
    } else {
        return '';
    }
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

var GetBlockHashesFromStartingBlock = ((startingBlock) => {
    var promise = new Promise((resolve, reject) => {
        blockRepository.GetBlockHashesFromStartingBlock(startingBlock)
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

var ValidateBlockHash = (async (block) => {
    var hashInput = block.nonce + block.solvedDateTime + MemPoolItemsAsJson(block.data) + block.difficulty;
    var hash = crypto.createHmac('sha256', hashInput).digest('hex');
    if (hash == block.blockHash) {
        return (hash);
    } else {
        throw new Error("Invalid hash. Validation failed.");
    }
});

var AddBlock = (async (block) => {
    var result =  await blockRepository.AddBlock(block);
    return result;
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



//Validates the block and makes sure it fits on the end of the chain. 
var ValidateAndAddIncomingBlock = (async (block) => {
    var hashValidationResult = await ValidateBlockHash(block);
    // console.log(`Successfully validated incoming block hash ${block.blockNumber}`);
    var mempoolValidationResults = await MemPoolController.ValidateMemPoolItems(block.data) //validate each memPoolItem (filecontents, signedmessage, publickey)
    // console.log(`Successfully validated memPoolItems on incoming block ${block.blockNumber}`);
    var lastBlock = await GetLastBlock();
    var calculatedDifficulty = await CalculateDifficulty(lastBlock);
    if (calculatedDifficulty != hexToDec(block.difficulty)) {
        throw new Error(`Invalid difficulty on incoming block. Incoming block difficulty was ${hexToDec(block.difficulty)}, but we calculated ${calculatedDifficulty}`);
    } else {
        // console.log(`Successfully validated difficulty on incoming block`);
    }
    if (block.blockNumber != lastBlock[0].blockNumber + 1) { //Make sure the last blocknumber is one less than the blocknumber being added
        throw new Error(`Invalid block number. Expecting ${lastBlock[0].blockNumber + 1} but instead got ${block.blockNumber}`);
    } else {
        if (block.previousBlockHash != lastBlock[0].blockHash) { //Make sure the block of the previous hash matches the previousBlockHash of the block being added.
            console.log("Invalid previous block hash.", block.previousBlockHash, lastBlock[0].blockHash);
            throw new Error("Invalid previous block hash");
        } else {
            console.log(`Adding block ${block.blockNumber}`);
            var addBlockResult = await AddBlock(block) //Finally... all validations passed.  Add the block to the end of the chain. 
            return ({ blockNumber: block.blockNumber, message: `Successfully imported block ${block.blockNumber}` });
        }
    }
});

//Validates JUST the block.  Does NOT validate that it fits on the end of the chain. 
var ValidateBlock = (async (block) => {
    var hashValidationResult = await ValidateBlockHash(block);
    console.log(`Successfully validated block: ${block.blockNumber}`);
    var mempoolValidationResults = await MemPoolController.ValidateMemPoolItems(block.data) //validate each memPoolItem (filecontents, signedmessage, publickey)
    console.log(`Successfully validated memPoolItems on block ${block.blockNumber}`);
    //get the block that's right before this one. 
    var previousBlock = await GetBlock(block.blockNumber - 1);
    var calculatedDifficulty = await CalculateDifficulty(previousBlock);
    if (calculatedDifficulty != hexToDec(block.difficulty)) {
        throw new Error(`Invalid difficulty on block. Block difficulty was ${hexToDec(block.difficulty)}, but we calculated ${calculatedDifficulty}`);
    } else {
        console.log(`Successfully validated difficulty on block`);
    }
});

var OrphanBlocks = (async (blocks) => {
    await blockRepository.MoveBlocksToOrphanCollection(blocks);
});


module.exports = {
    SolveBlock,
    MineNextBlock,
    GetFileFromBlock,
    ValidateBlockHash,
    GetLastBlock,
    AddBlock,
    GetBlocksFromStartingBlock,
    ValidateAndAddIncomingBlock,
    CreateGenesisBlock,
    ValidateBlock,
    GetBlockHashesFromStartingBlock,
    GetBlock,
    GetBlockHash,
    OrphanBlocks
}
