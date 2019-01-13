var hexToDec = require('hex-to-dec');
var decToHex = require('dec-to-hex');



//This is a really big number.  Which represents a low-difficulty situation, because it's easy to generate a hash less than this value.
//The LZ value ("Leading Zeros value") will be relatively low (17) because it is 17 characters less than 80 (in length when in hex)
var difficulty1 = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
console.log(`Difficulty is ${hexToDec(difficulty1)}`);
console.log(`Expressed as LZ: ${80-difficulty1.length}`);

//This is a slightly less big number.  It represents slightly-more-difficult situation that the previous number.  
//It's LZ value should be a little higher (23)
var difficulty2 = "0x35e30aec4186ae00000000000000000000000000000000000000000";
console.log(`Difficulty is ${hexToDec(difficulty2)}`);
console.log(`Expressed as LZ: ${80-difficulty2.length}`);

//This is a tiny number (15). This represents a super difficult situation that will never ever happen.  But note 
//that it's LZ is really high (77)
var difficulty3 = "0xf";
console.log(`Difficulty is ${hexToDec(difficulty3)}`);
console.log(`Expressed as LZ: ${80-difficulty3.length}`);
