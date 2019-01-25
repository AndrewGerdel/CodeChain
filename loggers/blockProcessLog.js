var fs = require('fs');
var dir = './logs';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

var writeToConsole = false;
var writeToFile = true;

var WriteLog = (async (input, writeToConsoleOverride) => {
    var output = `BlockProcessLog: ${new Date()}: ${input}`;
    if (writeToConsole || writeToConsoleOverride) {
        console.log(input);
    }
    if (writeToFile) {
        var now = new Date();
        var fileName = "BlockProcessLog_" + now.getFullYear() + "_" + (now.getMonth()+1) + "_" + now.getDate() + ".txt";
        var stream = fs.createWriteStream(`${dir}/${fileName}`, { flags: 'a' });
        stream.write(output + "\n");
        stream.end();
    }
});

module.exports = {
    WriteLog
}