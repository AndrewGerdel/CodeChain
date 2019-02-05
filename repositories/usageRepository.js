var { Usage } = require('../models/usage.js');
var mongoose = require('../db/mongoose.js');

mongoose.GetDb().then((db) => {
    db.collection("usages").createIndex({ "address": 1 }, { unique: false });
});

var AddUsageByAddress = (async (address, bytes, type, hash) => {
    var usage = new Usage({
        address: address,
        bytes: bytes,
        type: type,
        hash: hash
    });
    usage.save();
});

module.exports = {
    AddUsageByAddress
}