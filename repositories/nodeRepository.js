var { Node } = require('../models/node.js');
var mongoose = require('../db/mongoose.js');
var hashUtil = require('../utilities/hash.js');
var config = require('../config.json');

mongoose.GetDb().then((db) => {
    db.collection("nodes").createIndex({ "hash": 1 }, { unique: true });
    db.collection("nodes").createIndex({ "uid": 1 }, { unique: true });
});


var GetAllNodesExludingMe = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var nodes = db.collection('nodes').find({ "uid": { $ne: config.network.myUid } }).toArray();
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var GetMyNode = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var nodes = db.collection('nodes').find({ "uid": { $eq: config.network.myUid } }).toArray();
            }, (err) => {
                reject(err);
            });
    });
    return promise;
});

var GetAllNodes = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                var nodes = db.collection('nodes').find().toArray();
                resolve(nodes);
            }, (err) => {
                reject(err);
            });
    });
    return promise;
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


var AddNode = ((protocol, uri, port, uid) => {
    var promise = new Promise(async(resolve, reject) => {
        var hash = await hashUtil.CreateSha256Hash(`${protocol}${uri}${port}${uid}`);

        GetNode(hash).then((foundNode) => {
            if (foundNode.length == 0) {
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
                resolve(newNode);
            } else {
                resolve(foundNode[0]);
            }
        });
    });
    return promise;
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