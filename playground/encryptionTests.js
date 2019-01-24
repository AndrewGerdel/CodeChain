const crypto2 = require('crypto2');
var testAddress = require('./testAddresses');

var testit = (async() => {
    var timmy = testAddress.Timmy();
    var tommy = testAddress.Tommy();
    
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
    END SECRET MESSAGE
    `;

    const encrypted = await crypto2.encrypt.rsa(mySecretMessage,  timmy.PublicKey);
    // => [...]
     
    console.log(encrypted.length);
    
    const decrypted = await crypto2.decrypt.rsa(encrypted, timmy.PrivateKey);
    console.log(decrypted.length);
    
});

testit();