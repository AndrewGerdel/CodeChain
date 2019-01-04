var {Node} = require('../models/node.js');
var {MongoClient} = require('mongodb');
var mongoose = require('../db/mongoose.js');

var AddNewNode = ((uri) => {
    var promise = new Promise((resolve, reject) => {
        var newNode = new Node({
            uri : uri,
            dateAdded: new Date()
        })
        resolve(newNode.save());
    });
    return promise;
});

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        var url = 'mongodb://localhost:27017/CodeChain';
        MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db('CodeChain');
            var nodes = db.collection('nodes').find().toArray();
            resolve(nodes);
        });
    });
    return promise;
});

var AddNode = ((uri) => {
    var promise = new  Promise((resolve, reject) => {
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

module.exports ={
    GetAllNodes,
    AddNode
}