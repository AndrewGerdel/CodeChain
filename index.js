let memPoolController = require('./controllers/memPoolController.js');
let keyController = require('./controllers/keyController.js');
let {mongoose} = require('./db/mongoose.js');
let blockController = require('./controllers/blockController.js');
var hexToDec = require('hex-to-dec');
var {Block} = require('./models/block.js');

let publicKey = "0367220b4576f3704efd291208fd38c8199be1d6a821c92eca69d2138849a8e13f";
let privateKey = "a39911ddae60ab1d0be2cace99bf7f9a1b7fc2e3bdb45b76ffbfbd5a91c48745";
let fileContents = "These contents were created at: " + new Date();
const maxBlockSizeBytes = 1000000;

var signedMessage = keyController.SignMessage(fileContents, new Buffer(privateKey, 'hex'));
var startingDifficulty = "0x000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

memPoolController.AddCodeFileToMemPool("MyCode.cs", fileContents, signedMessage, publicKey)
  .then((result) => {
    MineNextBlock();
  })
  .catch((error) => {
    console.log('Error adding to mempool:', error);
  });


function MineNextBlock(){
  blockController.GetLastBlock()
    .then((lastBlock) => {
      if(lastBlock.length == 0){
          //there are no blocks.  Create one.
          var newBlock = blockController.CreateNewBlock('68f64f11fdcb97cdc5b4f52726cf923e6d3bc6f41f153ce91b7532221fa48fd7', 1, 'None', []);
          lastBlock.push(newBlock);
      }
      console.log('the last block is:', lastBlock[0].blockNumber);
      memPoolController.GetMemPoolItems()
        .then((memPoolItems) => {
          var sumFileSizeBytes = 0;
          var counter = 0;
          for(i=0;i<memPoolItems.length;i++){
             var element = memPoolItems[i];
             blockController.AddMemPoolItemToBlock(element);
             var fileSizeBytes = (element.fileContents.length * 0.75) - 2;
             sumFileSizeBytes += fileSizeBytes;
             console.log(element._id, "File name:", element.fileName,  "File Size:", fileSizeBytes);
             if(sumFileSizeBytes >= maxBlockSizeBytes){
                 break;
             }
           }//endfor
           blockController.HashBlock(hexToDec(startingDifficulty), lastBlock[0])
            .then((hashResult) => {
              console.log(hashResult);
            })
            .catch((error) => {
              console.log('Error in GetMemPoolItems', error);
            });
          })
        .catch((error) =>  { console.log(error); });
  });
}
