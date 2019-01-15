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
  transactionData: {
    from: {
      type: String,
      required: false,
      trim: true
    },
    to: {
      type: String,
      required: false,
      trim: true
    },
    amount: {
      type: Number,
      required: false,
    }
  },  
  publicKey: {
    type: String,
    required: true,
    trim: true
  },
  publicKeyHash: {
    type: String,
    required: true,
    trim: true
  },
  blockReward: {
    type: Number,
    required: false
  },
  dateAdded: {
    type: Date,
    required: true
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
  },
  deleted: {
    type: Boolean
  },
  salt: {
    type: String,
    required: true,
    trim: true
  },
});

module.exports = {
  MemPool : MemPool
}
