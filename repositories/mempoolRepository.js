var { MongoClient } = require('mongodb');
var mongoose = require('../db/mongoose.js');

//Gets all mempool items.
var GetMemPoolItems = (() => {
    var promise = new Promise((resolve, reject) => {
      var url = 'mongodb://localhost:27017/CodeChain';
      MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
        if(error){
          console.log('Unable to connect to Mongo');
          return;
        }
        var db = client.db('CodeChain');
        resolve(db.collection('mempools').find().sort({dateAdded: 1}).toArray());
      });
    });
    return promise;
  });
  
  //Deletes by _id all memPoolItems in the list
  var DeleteMemPoolItems = ((memPoolItems) => {
    var promise = new Promise((resolve, reject) => {
      var url = 'mongodb://localhost:27017/CodeChain';
      MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
        if(error){
          console.log('Unable to connect to Mongo');
          return;
        }
        var db = client.db('CodeChain');
        for(i=0;i<memPoolItems.length;i++){
          db.collection('mempools').deleteOne({_id : memPoolItems[i]._id});
        }
        resolve(true);
      });
    });
    return promise;
  });

  module.exports = {
      DeleteMemPoolItems, 
      GetMemPoolItems
  }
  