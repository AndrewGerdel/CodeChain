var mongoose = require('mongoose');
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
  }
});

module.exports = {
  Block : Block
}
