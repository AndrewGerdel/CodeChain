//seem to be getting different hashes between linux/windows

var crypto = require('crypto');
var hexToDec = require('hex-to-dec');

var abc = (async () => {

    var averageBlockTimeMs = 40000;
    var targetBlockTimeMs = 30000;
    var currentDifficulty = 10000000;

    if (averageBlockTimeMs < targetBlockTimeMs) {
        var diff = targetBlockTimeMs - averageBlockTimeMs;
        var percentage = (diff / targetBlockTimeMs);
        var newDifficulty = currentDifficulty - (currentDifficulty * percentage);
        return (newDifficulty);
    }
    else if (averageBlockTimeMs > targetBlockTimeMs) {
        var diff = averageBlockTimeMs - targetBlockTimeMs;
        var percentage = (diff / targetBlockTimeMs);
        var newDifficulty = currentDifficulty + (currentDifficulty * percentage);
        return (newDifficulty);
    }
    else if (averageBlockTimeMs == targetBlockTimeMs) {
        return (hexToDec(lastBlock[0].difficulty));
    }


});

abc();

// var hashInput = nonce + effectiveDate.toISOString() + MemPoolItemsAsJson(mempoolItems) + decToHex(difficulty) + previousBlock.blockHash;


// var nonce = 0;
// var effectiveDate = new Date('2019-01-26T18:41:59.412Z');
// var mempoolItems = [];
// var hashInput = 'The Genesis Block';
// var hash = crypto.createHmac('sha256', hashInput).digest('hex');

// console.log('effectivedate string is', effectiveDate.toISOString() );

// console.log('The hash is', hash);
