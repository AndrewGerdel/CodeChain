//Not used currently.  May use pastebin to store a list of active nodes, for when brand new nodes join the network.
var requestPromise = require('request-Promise');

var Testit = (async () => {
    var options = {
        uri: 'https://pastebin.com/raw/7Bvxz47q',
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };
    var result = await requestPromise(options);
    var parsedResult = result;//JSON.parse(result);
    console.log(parsedResult);

    return parsedResult;

});

var TestIt2 = (() => {
    var theText = ` 
    { 
        "nodes": [ 
            {
                "protocol" : "http",
                "uri" : "24.171.46.190",
                "port" : 80,
                "dateAdded" : "1/1/2000",
                "hash" : "966e6ac2a3cd46843b5f504425c1e051cb5eded7c14862603b00e6c2122535ff",
                "dateLastRegistered" : "1/1/2000",
                "uid" : "06a45e157f3b0d70e32ce3510ac43a3c"
            }, 
            {
                "protocol" : "http",
                "uri" : "24.171.46.190",
                "port" : 8080,
                "dateAdded" : "1/1/2000",
                "hash" : "966e6ac2a3cd46843b5f504425c1e051cb5eded7c14862603b00e6c2122535ff",
                "dateLastRegistered" : "1/1/2000",
                "uid" : "06a45e157f3b0d70e32ce3510ac43a3c"
            } 
        ]
    }`;

    var result = JSON.parse(theText);
    console.log(result.nodes[0].port);
    console.log(result.nodes[1].port);

});

TestIt2();


// const request = require("request");
// request("https://pastebin.com/raw/9fEBvGFz", { json: true }, (err, res, body) => {
// if (err) { return console.log(err); }
// console.log(body.url);
// console.log(body.explanation);
// console.log(body);
// });

// // var http = require('http');

// // var test = http.get({host: 'pastebin.com', path: 'raw/9fEBvGFz'}, ((response) => {
// //     console.log(response);
// // }));

// var GetPasteBinText = (() => {

// });