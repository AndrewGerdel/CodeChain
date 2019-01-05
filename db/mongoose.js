var mongoose = require('mongoose');
var connectionString = require('../config.json').database;

mongoose.Promise = global.Promise;
mongoose.connect(connectionString.host + connectionString.database, { useNewUrlParser: true });
module.exports = { mongoose };
