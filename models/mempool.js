var mongoose = require('mongoose');

var MemPool = mongoose.model('MemPool', {
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  publicKey: {
    type: String,
    required: true,
    trim: true
  },
  dateAdded: {
    type: Date,
    required: true
  },
  fileContents: {
    type: String,
    required: true,
    trim: true
  },
  signedMessage: {
    type: String,
    required: true,
    trim: true
  },
  hash: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = {
  MemPool : MemPool
}
