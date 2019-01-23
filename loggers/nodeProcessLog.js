var fs = require('fs');
var dir = './logs';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

var writeToConsole = false;
var writeToFile = true;

var WriteLog = (async (input) => {
    var output = `NodeProcessLog: ${new Date()}: ${input}`;
    if (writeToConsole) {
        console.log(output);
    }
    if (writeToFile) {
        var now = new Date();
        var fileName = "NodeProcessLog_" + now.getFullYear() + "_" + (now.getMonth()+1) + "_" + now.getDate() + ".txt";
        // var fileName = `NodeProcessLog_${now.getFullYear()}_${now.getMonth}_${now.getDate}.txt`;
        var stream = fs.createWriteStream(`${dir}/${fileName}`, { flags: 'a' });
        stream.write(output + "\n");
        stream.end();
    }
});

module.exports = {
    WriteLog
}