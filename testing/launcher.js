var server = require('../server');
var assert = require('assert');
var fs = require('fs');
var Mocha = require('mocha');
var mongoose = require('../db/mongoose');
const readline = require('readline');

//Create a new, empty database.
var now = new Date();
var databaseName = `CodeChainTest`;//_${now.getFullYear()}${now.getMonth()}${now.getDay()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

//set flags to get us in test mode. 
process.env.DATABASE = databaseName;
process.env.PORT = 3000;
process.env.DISABLENETWORKSYNC = true;
process.env.FIXEDDIFFICULTY = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var TestFileContents = {
    TestFile1: "Test file one contents."
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


server.StartServer(async () => {
    var mocha = new Mocha();

    mocha.addFile('./testing/testFileService.js');
    mocha.run(async function abc(failures) {
        if (failures > 0) {
            console.log('Failures: ', failures);
        } else {
            rl.question('Press enter once the block has been solved. ', () => {
                mocha.addFile('./testing/testFileService.js');
                mocha.run(async function abc(failures) {
                    console.log('hit here');
                    
                });
            });
        }
        // server.StopServer(async() => {
        // });
    });
});