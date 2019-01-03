var {Node} = require('../models.node.js');

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