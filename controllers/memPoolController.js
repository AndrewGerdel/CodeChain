var {MemPool} = require('../models/mempool.js');
var keyController = require('../controllers/keyController.js');

var AddCodeFileToMemPool = ((fileContents, signedMessage) => {
  let buff = new Buffer(fileContents);
  let base64data = buff.toString('base64');

  var memPool = new MemPool({
    fileContents: base64data,
    signedMessage: signedMessage
  });
  memPool.save();
  return base64data;
});

module.exports = {
  AddCodeFileToMemPool:AddCodeFileToMemPool
}
