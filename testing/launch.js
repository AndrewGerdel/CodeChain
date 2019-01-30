var genKeyPair = require('../utilities/generateKeypair');

//Create a new, empty database.
var now = new Date();
var databaseName = `CodeChain_${now.getFullYear()}${now.getMonth()}${now.getDay()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;
console.log(databaseName);

//set flags to get us in test mode. 
process.env.DATABASE = databaseName;
process.env.PORT = 8877;
process.env.DISABLENETWORKSYNC = true;

var server = require('../server');

var RunTests = (async() => {
});


var Test1 = (async() => {
    var keypair1 = await genKeyPair.GenerateKeyPair();
    
});

RunTests();

