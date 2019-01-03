var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

  mongoose.connect('mongodb://localhost:27017/CodeChain', { useNewUrlParser: true });
//this is a change 
module.exports = {mongoose};
