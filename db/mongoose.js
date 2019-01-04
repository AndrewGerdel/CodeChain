var mongoose = require('mongoose');
var connectionString = require('../config.json').database.connectionString;

mongoose.Promise = global.Promise;
mongoose.connect(connectionString, { useNewUrlParser: true });
module.exports = { mongoose };
