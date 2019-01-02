var mongoose = require('mongoose');
var mempool = require('./mempool.js');
// mongoose.connect('mongodb://localhost/CodeChain', { useNewUrlParser: true });

var Block = mongoose.model('Block', {
  blockNumber: {
    type: Number,
    required: true
  },
  previousBlockHash: {
    type: String,
    required: true,
    trim: true
  },
  blockHash: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Array,
    "default" : []
  },
  millisecondsBlockTime: {
    type: Number,
    required: true
  }
});

module.exports = {
  Block : Block
}
