var { Node } = require('../models/node.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;
var hashUtil = require('../utilities/hash.js');

var AddNewNode = ((protocol, uri) => {
    var promise = new Promise((resolve, reject) => {
        var newNode = new Node({
            protocol: protocol,
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

var GetNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            var nodes = db.collection('nodes').find({ hash: hash }).toArray();
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

//Deletes by _id supplied node
var DeleteNode = ((node) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            db.collection('nodes').deleteOne({ _id: node._id });
            resolve(true);
        });
    });
    return promise;
});

var UpdateNodeLastRegistrationDateTime = ((node) => {
    var promise = new Promise((resolve, reject) => {
        MongoClient.connect(connectionString.host, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                console.log('Unable to connect to Mongo');
                reject(error);
            }
            var db = client.db(connectionString.database);
            db.collection('nodes').updateOne({ _id: node._id }, { $set: { dateLastRegistered: new Date() } });
            resolve(true);
        });
    });
    return promise;
});

module.exports = {
    GetAllNodes,
    AddNode,
    DeleteNode,
    UpdateNodeLastRegistrationDateTime,
    GetNode
}