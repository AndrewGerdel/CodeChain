var { Node } = require('../models/node.js');
var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');
var connectionString = require('../config.json').database;
var hashUtil = require('../utilities/hash.js');

mongoose.GetDb().then((db) => {
    db.collection("nodes").createIndex({ "hash": 1 }, { unique: true });
});


//Should return all nodes EXCEPT FOR YOURSELF.  Because all nodes continuously broadcast their full nodelist to each other, it's known that each 
//node will contain a record for themselves.  We want to not use that record, so we're not wasting time broadcasting to ourselves.  But... we need
//to rely on other nodes to tell us our own hash, because that is calculated based on IP address, which will look different to us vs. the rest of the world.
//And that's why we use the registrationDetails.myHash value below... because during registration, each node let's us know our own hash, and that's where it gets stored.
var GetAllNodesExludingMe = (() => {
    var promise = new Promise((resolve, reject) => {
        mongoose.GetDb()
            .then((db) => {
                //Get OUR OWN HASH from registrationDetails.myHash, so it can be excluded from the next query below. 
                var getMyHash = db.collection('nodes').aggregate([
                    {
                        "$group":
                            { _id: "$registrationDetails.myHash", count: { $sum: 1 } }
                    },
                    { $sort: { "count": -1 } }
                ]).limit(1).toArray();

                getMyHash.then((result) => {
                    // console.log(`Hey, my hash must be ${result[0]._id}`);
                    var myHash = '';
                    if (result.length > 0) {
                        myHash = result[0]._id;
                    }
                    var nodes = db.collection('nodes').find({ "hash": { $ne: myHash } }).toArray();
                    resolve(nodes);
                }, (err) => {
                    reject(`Failed to get my hash: ${err}`);
                });
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
                //Get OUR OWN HASH from registrationDetails.myHash
                var getMyHash = db.collection('nodes').aggregate([
                    {
                        "$group":
                            { _id: "$registrationDetails.myHash", count: { $sum: 1 } }
                    },
                    { $sort: { "count": -1 } }
                ]).limit(1).toArray();

                getMyHash.then((result) => {
                    // console.log(`Hey, my hash must be ${result[0]._id}`);
                    var myHash = '';
                    if (result.length > 0) {
                        myHash = result[0]._id;
                    }
                    var nodes = db.collection('nodes').find({ "hash": { $eq: myHash } }).toArray();
                    resolve(nodes);
                }, (err) => {
                    reject(`Failed to get my hash: ${err}`);
                });
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


var AddNode = ((protocol, uri, port) => {
    var promise = new Promise(async(resolve, reject) => {
        var hash = await hashUtil.CreateSha256Hash(`${protocol}${uri}${port}`);

        GetNode(hash).then((foundNode) => {
            if (foundNode.length == 0) {
                var newNode = new Node({
                    protocol: protocol,
                    uri: uri,
                    port: port,
                    dateAdded: new Date(),
                    hash: hash.toString('hex'),
                    dateLastRegistered: new Date()
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