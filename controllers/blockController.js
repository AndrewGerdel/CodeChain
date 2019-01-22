var MemPoolController = require('./memPoolController.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var decToHex = require('dec-to-hex');
var nonce = 0;
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');
var config = require('../config.json');
var mempoolFileTypes = require('../enums/mempoolFiletypes');
var transactionRepository = require('../repositories/transactionRepository');
let jsonQuery = require('json-query')
const targetBlockTimeMs = 60000; //target a one minute block time. 

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
        var maxBlockSizeBytes = await CalculateTargetBlockSizeBytes(lastBlock[0].blockNumber + 1);
        var blockReward = await CalculateBlockReward(lastBlock[0].blockNumber + 1);
        var miningReward = await memPoolRepository.CreateMiningRewardMemPoolItem(new Date(), config.mining.publicKey, blockReward);
        memPoolItems.push(miningReward);
        for (memPoolCounter = 0; memPoolCounter < memPoolItemsFromDb.length; memPoolCounter++) {
            var element = memPoolItemsFromDb[memPoolCounter];
            var mempoolItemSizeBytes = (JSON.stringify(element).length * 0.75) - 2;
            sumFileSizeBytes += mempoolItemSizeBytes;
            if (element.type == mempoolFileTypes.Transaction) {
                var balance = await transactionRepository.GetBalance(element.publicKeyHash);
                if (balance >= element.transactionData.amount) {
                    memPoolItems.push(element);
                } else {
                    memPoolRepository.DeleteMemPoolItem(element);
                }
            } else {
                memPoolItems.push(element);
            }
            if (sumFileSizeBytes >= maxBlockSizeBytes) {
                console.log(`Total block size: ${sumFileSizeBytes} bytes`);

                break;
            }
        }//endfor

        if (memPoolItems.length > 1) { //If it only has the block reward, then don't do anything. 
            var newBlock = await SolveBlock(difficulty, lastBlock[0], memPoolItems);
            return newBlock;
        }
    }
});

var CreateGenesisBlock = ((lastBlock) => {
    var promise = new Promise((resolve, reject) => {
        if (!lastBlock || lastBlock.length == 0) {
            lastBlock = [];
            var nonce = 0;
            var effectiveDate = new Date('1/1/2000');
            var mempoolItems = [];
            var hashInput = 'The Genesis Block';
            var hash = crypto.createHmac('sha256', hashInput).digest('hex');
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

var CalculateTargetBlockSizeBytes = (async (blockNumber) => {
    //Placeholder, in case we want to change the target block size in the future.  For now, hardcoded to 10mb.
    return 10000000;
    // //Assumed 525,600 blocks per year
    // if (blockNumber <= 525600) { //first year
    //     return 10000000;
    // }
    // else if (blockNumber > 525600 && blockNumber <= 1051200) { //second year
    //     return 10000000;
    // }
    // else if (blockNumber > 1051200 && blockNumber <= 1576800) { //third year
    //     return 10000000;
    // }
    // else if (blockNumber > 1576800 && blockNumber <= 2102400) { //fourth year
    //     return 10000000;
    // }
    // else if (blockNumber > 2102400 && blockNumber <= 2628000) { //fifth year
    //     return 10000000;
    // }
    // else if (blockNumber > 2628000 && blockNumber <= 3153600) { //sixth year
    //     return 10000000;
    // }
    // else if (blockNumber > 3153600 && blockNumber <= 3679200) { //seventh year
    //     return 10000000;
    // }
    // else if (blockNumber > 3679200 && blockNumber <= 4204800) { //eigth year
    //     return 10000000;
    // }
    // else if (blockNumber > 4204800 && blockNumber <= 4730400) { //ninth year
    //     return 10000000;
    // }
    // else if (blockNumber > 4730400) { //tenth year and onward.
    //     return 10000000;
    // }
});

var CalculateBlockReward = (async (blockNumber) => {
    //Assumed 525,600 blocks per year
    if (blockNumber <= 525600) { //first year
        return 50;
    }
    else if (blockNumber > 525600 && blockNumber <= 1051200) { //second year
        return 25;
    }
    else if (blockNumber > 1051200 && blockNumber <= 1576800) { //third year
        return 12.5;
    }
    else if (blockNumber > 1576800 && blockNumber <= 2102400) { //fourth year
        return 6.25;
    }
    else if (blockNumber > 2102400 && blockNumber <= 2628000) { //fifth year
        return 6.25;
    }
    else if (blockNumber > 2628000 && blockNumber <= 3153600) { //sixth year
        return 3.125;
    }
    else if (blockNumber > 3153600 && blockNumber <= 3679200) { //seventh year
        return 1.5625;
    }
    else if (blockNumber > 3679200 && blockNumber <= 4204800) { //eigth year
        return 1.5625;
    }
    else if (blockNumber > 4204800 && blockNumber <= 4730400) { //ninth year
        return 0.78125;
    }
    else if (blockNumber > 4730400) { //tenth year and onward.
        return 0.3906;
    }
});

var CalculateDifficulty = (async (lastBlock) => {
    var result = await blockRepository.GetBlocks(100);
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
        //This is a "pulse" check.  Every so often (50000 iterations) check if another node has solved the block, OR if any of our current mempoolitems
        //exist in another block.  If either of these conditions are true, then we are wasting our time, so quit.  Even if we solved the block we'll end
        //up with a unique index violation.
        if (counter >= 50000) {
            counter = 0;
            var block = await blockRepository.GetBlock(targetBlockNumber);
            if (block.length > 0) {
                console.log(`Abandoning work on block ${targetBlockNumber}. Block solved by another node.`);
                return;
            }
            for (m = 0; m < mempoolItems.length; m++) {
                var memPoolResult = memPoolRepository.GetMemPoolItem(mempoolItems[m].hash);
                if (memPoolResult.length == 0) {
                    console.log(`Abandoning work on block ${targetBlockNumber}. MemPoolItem was included in a previous block.`);
                    return;
                }
            }
        }
        var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems) + decToHex(difficulty) + previousBlock.blockHash;
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
            console.log(`Nonce max value. Resetting nonce.`);
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

var GetBlocksFromStartingBlock = (async (startingBlock) => {
    var blocks = await blockRepository.GetBlocksFromStartingBlock(startingBlock);
    return blocks;
});

var GetBlocksByRange = (async(startingBlock, endingBlock) => {
    var blocks = await blockRepository.GetBlocksByRange(startingBlock, endingBlock);
    return blocks;
});

var GetBlockHashesFromStartingBlock = (async (startingBlock) => {
    var blocks = await blockRepository.GetBlockHashesFromStartingBlock(startingBlock);
    return blocks;
});

var GetFileFromBlock = (async (filehash) => {
    var file = await blockRepository.GetFileFromBlock(filehash);
    return file;
});

var GetRepoFromBlock = (async (repohash) => {
    debugger;
    var blocks = await blockRepository.GetRepoFromBlock(repohash);
    var results = [];
    for (bl = 0; bl < blocks.length; bl++) {
        var block = blocks[bl];
        var jsonQueryResult = jsonQuery('data.fileData[repo.hash=' + repohash + ']', { data: block });
        for (js = 0; js < jsonQueryResult.references[0].length; js++) {
            results.push({ FileName: jsonQueryResult.references[0][js].fileName, FileContents: jsonQueryResult.references[0][js].fileContents, Path: jsonQueryResult.references[0][js].repo.file });
        }
    }
    return results;
});

var ValidateBlockHash = (async (block) => {
    var hashInput = block.nonce + block.solvedDateTime + MemPoolItemsAsJson(block.data) + block.difficulty + block.previousBlockHash;
    var hash = crypto.createHmac('sha256', hashInput).digest('hex');
    if (hash == block.blockHash) {
        return (hash);
    } else {
        throw new Error("Invalid hash. Validation failed, block " + block.blockNumber);
    }
});

var AddBlock = (async (block) => {
    var result = await blockRepository.AddBlock(block);
    return result;
});

//appends a collection of blocks to the existing blockchain.
var AppendBlockchain = (async (blockchain) => {
    var lastBlockResult = await GetLastBlock();
});

//Validates an incoming block (received from another node) and makes sure it fits on the end of the chain. 
var ValidateAndAddIncomingBlock = (async (block) => {
    var hashValidationResult = await ValidateBlockHash(block);
    // console.log(`Successfully validated incoming block hash ${block.blockNumber}`);
    var blockReward = await CalculateBlockReward(block.blockNumber);
    if (block.data[0].type != mempoolFileTypes.MiningReward) {
        throw new Error("The first mempool item should be the block reward.");
    }
    if (block.data[0].blockReward != blockReward) {
        throw new Error("Invalid block reward.");
    }
    var mempoolValidationResults = await MemPoolController.ValidateMemPoolItemsOnIncomingBlock(block.data); //validate each memPoolItem (filecontents, signedmessage, publickey)
    // console.log(`Successfully validated memPoolItems on incoming block ${block.blockNumber}`);
    var lastBlock = await GetLastBlock();
    var calculatedDifficulty = await CalculateDifficulty(lastBlock);
    if (calculatedDifficulty != hexToDec(block.difficulty)) {
        throw new Error(`Invalid difficulty on incoming block ${block.blockNumber}. Incoming block difficulty was ${hexToDec(block.difficulty)}, but we calculated ${calculatedDifficulty}`);
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

var OrphanBlocks = (async (blocks) => {
    await blockRepository.MoveBlocksToOrphanCollection(blocks);
});

var GetFilesByAddress = (async (address) => {
    var results = [];
    var blocks = await blockRepository.GetBlocksWithAddress(address);
    var jsonQueryResult = jsonQuery("data[publicKeyHash='" + address + "']", { data: blocks });
    for (js = 0; js < jsonQueryResult.references[0].length; js++) {
        if (jsonQueryResult.references[0][js].fileData)
            results.push({ FileName: jsonQueryResult.references[0][js].fileData.fileName, Hash: jsonQueryResult.references[0][js].hash, DateAdded: jsonQueryResult.references[0][js].dateAdded });
    }
    return results;
});

var GetReposByAddress = (async (address) => {
    var results = [];
    var blocks = await blockRepository.GetBlocksWithAddress(address);
    var jsonQueryResult = jsonQuery("data[publicKeyHash='" + address + "']", { data: blocks });
    for (js = 0; js < jsonQueryResult.references[0].length; js++) {
        if (jsonQueryResult.references[0][js].fileData && jsonQueryResult.references[0][js].fileData.repo)
            if (results.filter(e => e.RepoHash === jsonQueryResult.references[0][js].fileData.repo.hash).length == 0)
                results.push({ RepoHash: jsonQueryResult.references[0][js].fileData.repo.hash, DateAdded: jsonQueryResult.references[0][js].dateAdded });
    }
    return results;
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
    GetBlockHashesFromStartingBlock,
    GetBlock,
    GetBlockHash,
    OrphanBlocks,
    CalculateBlockReward,
    GetRepoFromBlock,
    GetFilesByAddress,
    GetReposByAddress,
    GetBlocksByRange
}
