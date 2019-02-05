var mongoose = require('mongoose');
var Usage = mongoose.model('Usage', {
  address: {
    type: String,
    required: true,
    trim: true
  },
  bytes: {
    type: Number,
    required: true
  },
  type: {
    type: Number,
    required: true
  },
  hash: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = {
  Usage
}
