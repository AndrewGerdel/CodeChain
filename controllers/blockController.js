
var MemPoolController = require('./memPoolController.js');
var crypto = require('crypto');
var hexToDec = require('hex-to-dec');
var decToHex = require('dec-to-hex');
var memPoolRepository = require('../repositories/mempoolRepository.js');
var blockRepository = require('../repositories/blockRepository.js');
var config = require('../config.json');
var mempoolFileTypes = require('../enums/mempoolFiletypes');
var transactionRepository = require('../repositories/transactionRepository');
var hash = require('../utilities/hash');
let jsonQuery = require('json-query')
let blockLogger = require('../loggers/blockProcessLog');

const targetBlockTimeMs = 30000; //target a 30-second block time. 

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
        blockLogger.WriteLog(`MempoolItems found: ${memPoolItemsFromDb.length}. Working on them now...`, true);
        var maxBlockSizeBytes = await CalculateTargetBlockSizeBytes(lastBlock[0].blockNumber + 1);
        var blockReward = await CalculateBlockReward(lastBlock[0].blockNumber + 1);
        var miningReward = await memPoolRepository.CreateMiningRewardMemPoolItem(new Date(), config.mining.publicKey, blockReward);
        memPoolItems.push(miningReward);
        for (memPoolCounter = 0; memPoolCounter < memPoolItemsFromDb.length; memPoolCounter++) {
            var element = memPoolItemsFromDb[memPoolCounter];
            var mempoolItemSizeBytes = (JSON.stringify(element).length * 0.75) - 2;
            sumFileSizeBytes += mempoolItemSizeBytes;
            if (element.type == mempoolFileTypes.Transaction) {
                var balance = await transactionRepository.GetBalance(element.address);
                if (balance >= element.transactionData.amount) {
                    memPoolItems.push(element);
                } else {
                    memPoolRepository.DeleteMemPoolItem(element);
                }
            } else {
                memPoolItems.push(element);
            }
            if (sumFileSizeBytes >= maxBlockSizeBytes) {
                blockLogger.WriteLog(`Total block size: ${sumFileSizeBytes} bytes`);
                break;
            }
        }//endfor
        if (memPoolItems.length > 1) { //If it only has the block reward, then don't do anything. 
            var newBlock = await SolveBlock(difficulty, lastBlock[0], memPoolItems);
            return newBlock;
        }
    }
});

var CreateGenesisBlock = (async (lastBlock) => {
    if (!lastBlock || lastBlock.length == 0) {
        lastBlock = [];
        var nonce = 0;
        var effectiveDate = new Date('1/1/2000');
        var mempoolItems = [];
        //The genesis block contains a one-time 10,000 block reward to a single address.  This wallet will be used strictly for bounty payments, to help find
        //and fix bugs and report security vulnerabilities.  Any leftover funds will be publically donated to charity once the product reaches maturity. Monitor
        //the account below to keep us honest. 
        var genesisMemPoolItem = await memPoolRepository.CreateMiningRewardMemPoolItem(new Date('1/1/2000'), '958a555c810345cb39a82955f8a01720c775f72d1a96c5b77bc86b80d35e9066', 10000, 'These funds are strictly to be used for the bounty program.');
        mempoolItems.push(genesisMemPoolItem);
        var hashInput = 'The Genesis Block';
        var hash = crypto.createHmac('sha256', hashInput).digest('hex');
        var millisecondsBlockTime = targetBlockTimeMs - 1000; //one second slower than target
        var genesisDifficulty = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        var newBlock = blockRepository.CreateNewBlock(hash, 0, 'None', mempoolItems, millisecondsBlockTime, nonce, effectiveDate.toISOString(), genesisDifficulty);
        lastBlock.push(newBlock);
        return lastBlock;
    } else {
        return lastBlock;
    }
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
    //Assumed 1,051,200 blocks per year
    if (blockNumber <= 1051200) { //first year
        return 50;
    }
    else if (blockNumber > 1051200 && blockNumber <= 2102400) { //second year
        return 25;
    }
    else if (blockNumber > 2102400 && blockNumber <= 3153600) { //third year
        return 12.5;
    }
    else if (blockNumber > 3153600 && blockNumber <= 4204800) { //fourth year
        return 6.25;
    }
    else if (blockNumber > 4204800 && blockNumber <= 5256000) { //fifth year
        return 3.125;
    }
    else if (blockNumber > 5256000 && blockNumber <= 6307200) { //sixth year
        return 1.5625;
    }
    else if (blockNumber > 6307200 && blockNumber <= 7358400) { //seventh year
        return 0.78125;
    }
    else if (blockNumber > 7358400) { //eighth year and onward
        return 0.3906;
    }
});

var CalculateDifficulty = (async (lastBlock) => {
    if (process.env.FIXEDDIFFICULTY) {
        blockLogger.WriteLog("Using fixed difficulty for test mode");
        return (hexToDec(process.env.FIXEDDIFFICULTY));
    }

    var result = await blockRepository.GetBlocks(100);
    var totalMilliseconds = 0;
    for (var i = 0; i < result.length; i++) {
        totalMilliseconds += result[i].millisecondsBlockTime;
    }
    var currentDifficulty = hexToDec(lastBlock[0].difficulty);

    var averageBlockTimeMs = totalMilliseconds / result.length;
    if (averageBlockTimeMs < targetBlockTimeMs) {
        var diff = targetBlockTimeMs - averageBlockTimeMs;
        var percentage = (diff / targetBlockTimeMs);
        if (percentage > 0.1) {
            percentage = 0.1; //trying to smooth out our difficulty line a bit. Don't increase by more than 10%
        }
        blockLogger.WriteLog(`Decreasing difficulty by ${percentage} to make it harder to mine the next block...`, false);
        var newDifficulty = currentDifficulty - (currentDifficulty * percentage);
        return (newDifficulty);
    }
    else if (averageBlockTimeMs > targetBlockTimeMs) {
        var diff = averageBlockTimeMs - targetBlockTimeMs;
        var percentage = (diff / targetBlockTimeMs);
        blockLogger.WriteLog(`Increasing difficulty by ${percentage} to make it easier to mine the next block...`, false);
        var newDifficulty = currentDifficulty + (currentDifficulty * percentage);
        return (newDifficulty);
    }
    else if (averageBlockTimeMs == targetBlockTimeMs) {
        return (hexToDec(lastBlock[0].difficulty));
    }
});


function DifficultyAsHumanReadable(difficulty) {
    var difficultyAsHexString = decToHex(difficulty).toString("hex");
    return 80 - difficultyAsHexString.length;
}

//Hashes the current mempool items along with a nonce and datetime until below supplied difficulty.
var SolveBlock = (async (difficulty, previousBlock, mempoolItems) => {
    var nonce = 0;

    let targetBlockNumber = previousBlock.blockNumber + 1;
    blockLogger.WriteLog(`Difficulty calculated at ${DifficultyAsHumanReadable(difficulty)}LZ. Working on block ${targetBlockNumber}.`, true);
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
                blockLogger.WriteLog(`Abandoning work on block ${targetBlockNumber}. Block solved by another node.`, true);
                return;
            }
            for (m = 0; m < mempoolItems.length; m++) {
                var memPoolResult = memPoolRepository.GetMemPoolItem(mempoolItems[m].hash);
                if (memPoolResult.length == 0) {
                    blockLogger.WriteLog(`Abandoning work on block ${targetBlockNumber}. MemPoolItem was included in a previous block.`, true);
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
            blockLogger.WriteLog(`Nonce max value. Resetting nonce.`);
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

var GetBlockHashByRange = (async (startingBlock, endingBlock) => {
    var blocks = await blockRepository.GetBlocksByRange(startingBlock, endingBlock);
    var stringToHash = '';
    for (b = 0; b < blocks.length; b++) {
        var blockHash = await hash.CreateSha256Hash(`${blocks[b].blockNumber}${blocks[b].blockHash}${blocks[b].previousBlockHash}`);
        stringToHash += blockHash.toString('hex');
        for (d = 0; d < blocks[b].data.length; d++) {
            if (blocks[b].data[d].type == 1) {
                var dataHash = await hash.CreateSha256Hash(`${blocks[b].data[d].fileData.fileName}${blocks[b].data[d].fileData.fileContents}`);
                stringToHash += dataHash.toString('hex');
            }
        }
    }
    var hashResult = await hash.CreateSha256Hash(stringToHash);
    return hashResult.toString('hex');
});

var GetBlockHashesFromStartingBlock = (async (startingBlock) => {
    var blocks = await blockRepository.GetBlockHashesFromStartingBlock(startingBlock);
});

var GetFileFromBlock = (async (filehash) => {
    var file = await blockRepository.GetFileFromBlock(filehash);
    return file;
});

var GetRepoFromBlock = (async (repohash) => {
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

var GetEncryptedRepoFromBlock = (async (repohash, privateKey) => {
    var blocks = await blockRepository.GetRepoFromBlock(repohash);
    var results = [];
    for (bl = 0; bl < blocks.length; bl++) {
        var block = blocks[bl];
        var jsonQueryResult = jsonQuery('data.fileData[repo.hash=' + repohash + ']', { data: block });
        for (js = 0; js < jsonQueryResult.references[0].length; js++) {
            var decrypted = await crypto2.decrypt.rsa(jsonQueryResult.references[0][js].fileContents, privateKey);
            results.push({ FileName: jsonQueryResult.references[0][js].fileName, FileContents: decrypted, Path: jsonQueryResult.references[0][js].repo.file });
        }
    }
    return results;
});

var ValidateBlockHash = (async (block) => {
    var hashInput = block.nonce + block.solvedDateTime + MemPoolItemsAsJson(block.data) + block.difficulty + block.previousBlockHash;
    var hash = crypto.createHmac('sha256', hashInput).digest('hex');
    if (hash == block.blockHash) {
        return true;
    } else {
        return false;
    }
});

var ValidateLocalBlockchain = (async (lowBlockNumber, highBlockNumber) => {
    var blocks = await blockRepository.GetBlocksByRange(lowBlockNumber - 1, highBlockNumber);
    //validate all the blocks, starting at element 1 (because we fetched by low-1)
    var invalidBlockNumber = 0;
    for (var blockNum = 1; blockNum < highBlockNumber - lowBlockNumber; blockNum++) {
        var validated = await ValidateBlockHash(blocks[blockNum]);
        if (validated == false) {
            blockLogger.WriteLog(`Found invalid block, block number ${blocks[blockNum].blockNumber}. Orphaning and pulling all blocks after that point.`, true);
            invalidBlockNumber = blocks[blockNum].blockNumber;
            break;
        }
    }
    if (invalidBlockNumber > 0) {
        var blocksToOrphan = await blockRepository.GetBlocksFromStartingBlock(invalidBlockNumber - 1);
        OrphanBlocks(blocksToOrphan);
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
    if (hashValidationResult == false) {
        throw new Error("Could not validate hash of block.");
    }
    //blockLogger.WriteLog(`Successfully validated incoming block hash ${block.blockNumber}`);
    var blockReward = await CalculateBlockReward(block.blockNumber);
    if (block.data[0].type != mempoolFileTypes.MiningReward) {
        throw new Error("The first mempool item should be the block reward.");
    }
    if (block.data[0].blockReward != blockReward) {
        throw new Error("Invalid block reward.");
    }
    var mempoolValidationResults = await MemPoolController.ValidateMemPoolItemsOnIncomingBlock(block.data); //validate each memPoolItem (filecontents, signedmessage, publickey)
    // blockLogger.WriteLog(`Successfully validated memPoolItems on incoming block ${block.blockNumber}`);
    var lastBlock = await GetLastBlock();
    var calculatedDifficulty = await CalculateDifficulty(lastBlock);
    if (calculatedDifficulty != hexToDec(block.difficulty)) {
        throw new Error(`Invalid difficulty on incoming block ${block.blockNumber}. Incoming block difficulty was ${hexToDec(block.difficulty)}, but we calculated ${calculatedDifficulty}`);
    } else {
        // blockLogger.WriteLog(`Successfully validated difficulty on incoming block`);
    }
    if (block.blockNumber != lastBlock[0].blockNumber + 1) { //Make sure the last blocknumber is one less than the blocknumber being added
        throw new Error(`Invalid block number. Expecting ${lastBlock[0].blockNumber + 1} but instead got ${block.blockNumber}`);
    } else {
        if (block.previousBlockHash != lastBlock[0].blockHash) { //Make sure the block of the previous hash matches the previousBlockHash of the block being added.

            blockLogger.WriteLog("Invalid previous block hash.", block.previousBlockHash, lastBlock[0].blockHash);
            throw new Error("Invalid previous block hash");
        } else {
            blockLogger.WriteLog(`Adding block ${block.blockNumber}`, true);
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
    var jsonQueryResult = jsonQuery("data[address='" + address + "']", { data: blocks });
    for (js = 0; js < jsonQueryResult.references[0].length; js++) {
        if (jsonQueryResult.references[0][js].fileData)
            results.push({ FileName: jsonQueryResult.references[0][js].fileData.fileName, Hash: jsonQueryResult.references[0][js].hash, DateAdded: jsonQueryResult.references[0][js].dateAdded });
    }
    return results;
});

var GetReposByAddress = (async (address) => {
    var results = [];
    var blocks = await blockRepository.GetBlocksWithAddress(address);
    var jsonQueryResult = jsonQuery("data[address='" + address + "']", { data: blocks });
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
    GetBlockHashByRange,
    GetEncryptedRepoFromBlock,
    ValidateLocalBlockchain
}
