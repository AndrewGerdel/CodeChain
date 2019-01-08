var { Node } = require('../models/node.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;
var hashUtil = require('../utilities/hash.js');

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                return;
            }
            var db = client.db(connectionString.database);
            var nodes = db.collection('nodes').find().toArray();
            client.close();
            resolve(nodes);
        });
    });
    return promise;
});

var GetNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            var nodes = db.collection('nodes').find({ hash: hash }).toArray();
            client.close();
            resolve(nodes);
        });
    });
    return promise;
});


var GetNodeWithLongestChain = (() => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            var nodes = db.collection('nodes').find().sort({ "registrationDetails.blockHeight": -1 }).limit(1).toArray();
            client.close();
            resolve(nodes);
        });
    });
    return promise;
});


var AddNode = ((protocol, uri, port) => {
    var promise = new Promise((resolve, reject) => {
        var hash = hashUtil.CreateSha256Hash(`${protocol}${uri}${port}`).toString('hex');
        GetNode(hash).then((foundNode) => {
            if (foundNode.length == 0) {
                var newNode = new Node({
                    protocol: protocol,
                    uri: uri,
                    port: port,
                    dateAdded: new Date(),
                    hash: hash,
                    dateLastRegistered: new Date()
                });
                newNode.save();
                resolve(newNode);
            }
        });
    });
    return promise;
});

//Deletes node by hash
var DeleteNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            db.collection('nodes').deleteOne({ hash: hash });
            client.close();
            resolve(true);
        });
    });
    return promise;
});

var UpdateNodeRegistration = ((node, details) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            db.collection('nodes').updateOne({ _id: node._id }, 
                { $set: 
                    { 
                        dateLastRegistered: new Date(), 
                        registrationDetails: { blockHeight: details.myBlockHeight, myHash: details.yourHash} 
                    } 
                });
            client.close();
            resolve(true);
        });
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode,
    DeleteNode,
    UpdateNodeRegistration,
    GetNode,
    GetNodeWithLongestChain
}