//Not used currently.  May use pastebin to store a list of active nodes, for when brand new nodes join the network.

const request = require("request");
request("https://pastebin.com/raw/9fEBvGFz", { json: true }, (err, res, body) => {
if (err) { return console.log(err); }
console.log(body.url);
console.log(body.explanation);
console.log(body);
});

// var http = require('http');

// var test = http.get({host: 'pastebin.com', path: 'raw/9fEBvGFz'}, ((response) => {
//     console.log(response);
// }));

var GetPasteBinText = (() => {
 
});