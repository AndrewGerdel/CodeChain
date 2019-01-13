var { Node } = require('../models/node.js');
var mongoose = require('../db/mongoose.js');
var hashUtil = require('../utilities/hash.js');
var config = require('../config.json');
var nodeProcessLog = require('../loggers/nodeProcessLog');

mongoose.GetDb().then((db) => {
    db.collection("nodes").createIndex({ "hash": 1 }, { unique: true });
    db.collection("nodes").createIndex({ "uid": 1 }, { unique: true });
});


var GetAllNodesExludingMe = (async () => {
    var db = await mongoose.GetDb();
    var nodes = db.collection('nodes').find({ "uid": { $ne: config.network.myUid } }).toArray();
    return nodes;
});

var GetMyNode = (async () => {
    var db = await mongoose.GetDb();
    var nodes = db.collection('nodes').find({ "uid": { $eq: config.network.myUid } }).toArray();
    return nodes;
});

var GetAllNodes = (async () => {
    var db = await mongoose.GetDb();
    var nodes = db.collection('nodes').find().toArray();
    return nodes;
});

var GetNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var nodes = db.collection('nodes').find({ hash: hash }).toArray();
                resolve(nodes);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});


var GetNodeWithLongestChain = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var nodes = db.collection('nodes').find().sort({ "registrationDetails.blockHeight": -1 }).limit(1).toArray();
                resolve(nodes);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});


var AddNode = (async (protocol, uri, port, uid) => {
    var hash = await hashUtil.CreateSha256Hash(`${protocol}${uri}${port}${uid}`);
    var foundNode = await GetNode(hash);
    if (foundNode.length == 0) {
        nodeProcessLog.WriteLog(`Adding node: ${protocol}://${uri}:${port} (${uid})`);
        var newNode = new Node({
            protocol: protocol,
            uri: uri,
            port: port,
            dateAdded: new Date(),
            hash: hash.toString('hex'),
            dateLastRegistered: new Date(),
            uid: uid
        });
        newNode.save();
        return newNode;
    } else {
        return foundNode[0];
    }
});

//Deletes node by hash
var DeleteNode = ((hash) => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                db.collection('nodes').deleteOne({ hash: hash });
                resolve(true);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var UpdateNodeRegistration = ((node, details) => {
    var promise = new Promise((resolve, reject) => {

        mongoose.GetDb()
            .then((db) => {
                db.collection('nodes').updateOne({ _id: node._id },
                    {
                        $set:
                        {
                            dateLastRegistered: new Date(),
                            registrationDetails: { blockHeight: details.myBlockHeight, myHash: details.yourHash }
                        }
                    });

                resolve(true);
            }, (err) => {
                reject(err);
            });

    });
    return promise;
});

var GetRandomNodes = (async (numberToReturn) => {
    var db = await mongoose.GetDb();

    var nodes = await db.collection('nodes').aggregate([{ $sample: { size: numberToReturn } }]).toArray();
    return nodes;
});


module.exports = {
    GetAllNodesExludingMe,
    AddNode,
    DeleteNode,
    UpdateNodeRegistration,
    GetNode,
    GetNodeWithLongestChain,
    GetRandomNodes,
    GetAllNodes,
    GetMyNode
}