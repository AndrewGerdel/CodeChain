

var LoopTransaction = ((val) => {
    if (val == true) {
        var timmyToTommy = require('./TimmyToTommy');
    }else{
        var tommyToTimmy = require('./TommyToTimmy');
    }
    setTimeout(() => {
        if(val == true){
            LoopTransaction(false);
        }else{
            LoopTransaction(true);
        }
    }, 1000);
});

LoopTransaction(true)