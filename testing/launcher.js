var server = require('../server');
var assert = require('assert');
var fs = require('fs');
var Mocha = require('mocha');
var mongoose = require('../db/mongoose');

//Create a new, empty database.
var now = new Date();
var databaseName = `CodeChain_${now.getFullYear()}${now.getMonth()}${now.getDay()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

//set flags to get us in test mode. 
process.env.DATABASE = databaseName;
process.env.PORT = 8877;
process.env.DISABLENETWORKSYNC = true;
process.env.FIXEDDIFFICULTY = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

var TestFileContents = {
    TestFile1: "Test file one contents."
};

server.StartServer(async () => {
    var mocha = new Mocha();
    mocha.addFile('./testing/test1.js');
    mocha.addFile('./testing/testFileService.js');

    mocha.run(async function abc(failures) {
        debugger;
        console.log('Failures: ', failures);
        server.StopServer(async() => {
            console.log('DROPPING THE DB NOW');
            var db = await mongoose.GetDb();
            console.log('DROPPING THE DB NOW');
debugger;

            db.dropDatabase((err, result) => {
                debugger;
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(result);

                }
            });


            console.log('hello');
        });
    });





});