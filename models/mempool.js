var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/CodeChain', { useNewUrlParser: true });

var MemPool = mongoose.model('MemPool', {
  fileContents: {
    type: String,
    required: true,
    trim: true
  },
  signedMessage: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = {
  MemPool : MemPool
}
