var mongoose = require('mongoose');
var Node = mongoose.model('Node', {
  protocol: {
    type: String,
    required: true,
    trim: true
  },
  uri: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true
  },
  dateAdded: {
    type: Date,
    required: true
  },
  dateLastRegistered: {
    type: Date,
    required: false
  },
  hash : {
    type: String,
    require: true
  },
  uid : {
    type: String,
    require: true
  },
  registrationDetails : {
    blockHeight : {
      type: Number,
      require: false
    }
  },
  blacklistUntilBlock : {
    type: Number,
    require: false
  }
});

module.exports = {
  Node
}
