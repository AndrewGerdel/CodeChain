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
    },
    repo:{
      name: {
        type: String,
        require: false,
        trim: true
      },
      hash: {
        type: String,
        require: false,
        trim: true
      },
      file:{
        type: String,
        require: false,
        trim: true
      }
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
  messageData: {
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
    messageText: {
      type: String,
      required: false,
      trim: true
    }
  },
  publicKey: {
    type: String,
    required: true,
    trim: true
  },
  address: {
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
  signedMessageHash: {
    type: String,
    required: true,
    trim: true
  },
  hash: {
    type: String,
    required: true,
    trim: true
  },
  salt: {
    type: String,
    required: false,
    trim: true
  },
  deleted: {
    type: Boolean
  }
});

module.exports = {
  MemPool: MemPool
}
