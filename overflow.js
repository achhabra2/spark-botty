// Test HTTPS Server

var express = require('express'),
    bodyParser = require('body-parser'),
    bot = require('./bot'),
    multer = require('multer'),
    config = require('./config'),
    needle = require('needle'),
    https = require('https'),
    http = require('http'),
    fs = require('fs');

var app = express();

var HTTP_PORT = config.port;
var HTTPS_PORT = config.securePort;
app.all('*', function(req, res, next){
if (req.secure) {
  return next();
};
res.redirect('https://localhost:'+HTTPS_PORT+req.url);
// res.redirect('https://'+req.hostname+':'+HTTPS_PORT+req.url);
});
// HTTPS
var secureServer = https.createServer({
    key: fs.readFileSync('keys/ec2_teamwmc_com.key'),
    cert: fs.readFileSync('keys/ec2_teamwmc_com.crt'),
    ca: fs.readFileSync('keys/ca.bundle')
  }, app)
  .listen(HTTPS_PORT, function () {
    console.log('Secure Server listening on port ' + HTTPS_PORT);
});

var insecureServer = http.createServer(app).listen(HTTP_PORT, function() {
  console.log('Insecure Server listening on port ' + HTTP_PORT);
})

// Hello World
app.get('/', function (req, res) {
  res.send('Hello World!');
});
