var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

  mongoose.connect('mongodb://localhost/CodeChain', { useNewUrlParser: true });

module.exports = {mongoose};
