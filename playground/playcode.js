var hash = require('../utilities/hash');

var result = hash.CreateSha256Hash(`-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAyzbrXVIIilV221TgS9g8
XyzYJbG4ddxfdfoYkcmjmqpocqV5/zbwjoFqeFPxSGMqilQa3Yz1GAaAHUnoJMY9
5SxK0wHNhdaXTwSk2E1cSaExBGxe417wvm6GqdRhFAtR1g1xUlbRI4zTexjAUnsx
1uf7TjWTuP80D4Tt9EBpqhLtw0bSDYdfF8ZmvuHV8jkNjjw8f4Yb1riTDGqnI0kG
tAhZWefwI0WosXRJqgF6eMFERdvPbMYPysvrxukpU5G3iCwj3oiry6X+FtAx4OgW
FPquriCxRumxSsO3nvZ/uPAf8BHwjSQ0z7WHL25dQFpy0OYJaIWC6wGN0knLKToW
ZLuKmjdIVbryaH15I6eCbghBGIDzGTcu1iyHvf5QQUxzY1Wu+neYvEs+uaTg0Ihs
i2xvxIWJRGsA5NRT8Gr461UgHkzD3qm/Z8Qdswotd/2xVXN1CHsZQBNchvROY/L+
A9U+ax9Qw7NxzGYmg/UubS4ZUis02ZibVBw8PFJO44ubh8LlYz7+KstI+uUC8zQ3
ErXX4JqflQL3kdKzal8k7NdZhvw0T7tA9/hbjJel8VYeTJ9sdkjAH/GylYEkBcxm
MbCeknkvx7atSV4xLu30J9ViZeeo9XJlzqmkZrp66ljSsO84vy4kpJCrHFv8AWaA
Eb2Ss2ysKNPac0iJYTXKWusCAwEAAQ==
-----END PUBLIC KEY-----`).then((result) => {
    console.log('address is', result.toString('hex'));
})


hash.GenerateKeyPair().then((result) => {
    console.log(result.publicKey, result.privateKey);
    hash.CreateSha256Hash(result.publicKey).then((address) => {
        console.log('address is: ', address.toString('hex'));
        
    });
});

