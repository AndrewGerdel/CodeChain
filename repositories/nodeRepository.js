var { Node } = require('../models/node.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;

var AddNewNode = ((uri) => {
    var promise = new Promise((resolve, reject) => {
        var newNode = new Node({
            uri: uri,
            dateAdded: new Date()
        })
        resolve(newNode.save());
    });
    return promise;
});

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var nodes = db.collection('nodes').find().toArray();
            resolve(nodes);
        });
    });
    return promise;
});

var AddNode = ((uri) => {
    var promise = new Promise((resolve, reject) => {
        var newNode = new Node({
            uri: uri,
            dateAdded: new Date()
        });
        newNode.save();
        debugger;
        resolve(newNode);
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode
}