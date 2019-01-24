const crypto2 = require('crypto2');
var testAddress = require('./testAddresses');
var zlib = require('zlib');
var hash = require('../utilities/hash');

var testit = (async () => {
    var timmy = testAddress.Timmy();

    var mySecretMessage = `
    BEGIN SECRET MESSAGE
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  Many secrets.  
    END SECRET MESSAGE.
    `;

    console.log('Original Length:', mySecretMessage.length);

    zlib.deflate(mySecretMessage, (err, buffer) => {
        console.log('Compressed Length:', buffer.toString('base64').length);
        var bufferForUnzip = new Buffer.from(buffer.toString('base64'), 'base64');
        zlib.unzip(bufferForUnzip, (err, buffer2) => {
            console.log('Decompressed Length:', buffer2.toString().length);
        });
    });

    const encrypted = await crypto2.encrypt.rsa(mySecretMessage, timmy.PublicKey);
    console.log('Encrypted Length:', encrypted.length);

    const decrypted = await crypto2.decrypt.rsa(encrypted, timmy.PrivateKey);
    console.log('Decrypted Length:', decrypted.length);

});

testit();