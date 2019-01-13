var request = require('request');

var loopPost = (() => {
    var nodeEndpoint = `http://localhost:65341/file/upload`;
debugger;
    var options = {
      url: nodeEndpoint,
      method: 'POST',
      json: {
          filename: 'loopPoster.txt',
          filecontents: 'Some text that is in the loop file',
          publickey: `-----BEGIN PUBLIC KEY-----
          MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtiy8AEYK6hbLkEFkHLVV
          tX90v3D/y4pfts716IJvN8NMA7CgmST6tFKCzx7H9SyuIWUIuhMqf2Ria09H8azz
          YuQ15xipsJwwLKO7O7raoEG/9v3Zo4fe5660bGgHKBM8rNLyGFT9EZlWA3zFoBhL
          Dqdiz7sLhEqPPr7i7mSItTaacNIZAvPoU0I68UGlKm16Z1/cd3BpkoujEntDwsXi
          7PaoS90S6bjiDEAe6bcuT1G8BYSvY/tueK/10n+CSlUy6qMXFIDgq5cxnoOIuJvV
          s89CAiDPyBQBMienHXvARtL9FUQFug+Ztbal8uXhFtLP/UbUorCTJ0SskhsJ7kjA
          v68pjKoCsh4SDKfz1xfC6iHQ6mquNdzabZaQBggsIBL9xCiKyLST5KfWCbGn4lAt
          Qd9y21E23SiMJ5hYRyb/znzWJMMXBhgK6CElKHVlgV9+GygznMabT65L4uT235ZC
          o8qeXI7rY/4ectsszoMFqnAejxJHH0ePIjYbDWq4URmnA1KHX38T89XR23+wS8tX
          O1LwHUQPGVVVWr1bOSi0ueSFkl+y/PmgwTnvJIktxDEY5ck8u2SRfKfXjfY3qaQp
          NcF81mIRzgvKvtrLVpP67UBhuhchQIIh4jaDacB9UOFLgHOsjMlIZN4FO2s7IxZp
          LIiO18nqs4bFPGfuFlQ/QUMCAwEAAQ==
          -----END PUBLIC KEY-----`, 
          privatekey: `-----BEGIN PRIVATE KEY-----
          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
          vuAJApEY9YdcOZVAOZB4tC+RN9LNhQ==
          -----END PRIVATE KEY-----`
      },  
      headers: {
        'Content-Length': 4000,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    };
    request(options, (err, res, body) => {
        console.log('err is ', err);
        console.log('res is ', res);
        console.log('body is ', body);
        
      debugger;
    });
});

loopPost();