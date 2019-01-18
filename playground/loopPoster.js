var request = require('request');

var loopPost = (async (nodeEndpoint) => {
    
    console.log('Endpoint is', nodeEndpoint);

    const data = JSON.stringify({
        filename: 'postedFile.txt',
        filecontents: 'The current time is ' + new Date(),
        publickey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxg7ikluLtaMUE0CwRXEG
XMv+FxT0zRG1LecfnE1wnGzlkecL15ss271DOJOYyY/F7QDW3LDx4BaYwU0jOwZn
teF0x2fREoQCthX5eADNeRBJwnwwcDbYTNiD/01kKiGrxDWvblPdPbB8NRVI1Z2M
bxvVBtkKMmIYnLLQbK3aqnGqjO+u8BaoUqo8nXFjrax1I3Fm9DwoRQLFI+M3iHIF
yKlRy8rhs7c5RqAmK47yTgdxgaE9CuSKjeazxKjx9FAEWFB/H2tkwLeZqQVUjyAZ
2KZ/9h8DFwaqJaXk8In+3TQKB6zbQIUr859p9Nb3kpqSGLl4uoAfxW0iha5LWWlO
H3RF0aJrn38Kyzz4oJFF/h2bDgtLim0kmg/IyUxlDJoJhcc9+FvcN+aq13oGRIaM
1U+ViokgDJzLykkXgfZzhNXhRE0/iqiy+Gd9G7Krqn08c4YdoBvpaRdtDnG6RmN3
GGHqrN3DCsddP6jE2DRCztuf0CaJJ8pcS9dtLoWMnqzZggbS/4EAVSoJcTWmH9BV
HrQzGqlQ2mDzSZNalzSi5ADn42qM9oX+vHxUNNrpzAXwTXr8VAbumpBRSxmq/wfX
wuRLkwAczL4pGi5zL4DfJntYj4S31ynwCfLGxxgFzAkL/lAtk7ItBG/YkFYLLTfj
9hZnWBfKmWMGxi/3/4HfRPsCAwEAAQ==
-----END PUBLIC KEY-----`,
        privatekey: `-----BEGIN PRIVATE KEY-----
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
zEKS3/ZNonEKaNsBXhxUDAxZ31IE
-----END PRIVATE KEY-----`

    });

    const options = {
        uri: nodeEndpoint,
        path: '/file/upload',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data
    }

    request(options, (err, res, body) => {
        if (err) {
            console.log('!!!!!!!!!!!!!!!! FAILURE:', err);
        } else {
            console.log(body);
        }

        setTimeout((evenOdd) => {
            if (nodeEndpoint == "http://localhost:65340/file/createSubmitRequest") {
                nodeEndpoint = "http://localhost:65340/file/createSubmitRequest";  //put your alternating url here. 
            } else {
                nodeEndpoint = "http://localhost:65340/file/createSubmitRequest";
            }
            loopPost(nodeEndpoint);
        }, 6000);
    });

});

loopPost('http://localhost:65340/file/createSubmitRequest');