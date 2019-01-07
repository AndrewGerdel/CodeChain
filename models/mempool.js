var mongoose = require('mongoose');

var MemPool = mongoose.model('MemPool', {
  type: {
    type: Number,
    required: true
  },
  fileData: {
    fileName: {
      type: String,
      required: false,
      trim: true
    },
    fileContents: {
      type: String,
      required: false,
      trim: true
    }
  },  
  dateAdded: {
    type: Date,
    required: true
  },
  publicKey: {
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
