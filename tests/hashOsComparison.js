//seem to be getting different hashes between linux/windows

var crypto = require('crypto');

var nonce = 0;
var effectiveDate = new Date('1/1/2000');
var mempoolItems = [];
var hashInput = nonce + effectiveDate.toISOString() + JSON.stringify(mempoolItems) + 'None';
var hash = crypto.createHmac('sha256', hashInput).digest('hex');

console.log('The hash is', hash);
