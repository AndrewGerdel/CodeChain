const express = require('express');
const bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


  //start listening for file requests
  var fileService = require('../webServices/fileService.js');
  fileService.StartService(app);

  //start listening for communications from users via a browser, or from other nodes on the network. 
  app.listen(65340, () => {
    console.log('Test is up and running');
  });