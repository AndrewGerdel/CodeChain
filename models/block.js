var mongoose = require('mongoose');

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
    "default": []
  },
  millisecondsBlockTime: {
    type: Number,
    required: true
  },
  nonce: {
    type: Number,
    required: true
  },
  solvedDateTime: {
    type: String,
    required: true
  }
});

module.exports = {
  Block: Block
}
