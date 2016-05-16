var express = require('express');
var bodyParser = require('body-parser');
var bot = require('./bot');

var app = express();
var botty = new bot();
botty.init();

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/', function (req, res) {
  res.send('Thanks');
  console.log("Received Message From: " + req.body.data.personEmail);
  console.log(req.body.data.id);
  if (req.body.data.personEmail != "aman.chhabra1@gmail.com")
    botty.processMessage(req.body.data.id)
    .then((msgId) => {
      console.log("Succesfully processed message");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(80, function () {
  console.log('Spark Botty Up and running on port 80');
});

botty.onText(/\/echo (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMessage(text).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing.");
  });
});

botty.onText(/\/call (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMessage(text).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing.");
  });
});

botty.onText(/\/text\s(\+1\d{10})\s(.+)/, (message, regArray) => {
  botty.sendSMS(regArray[1], regArray[2]).then((status) => {
    console.log(status);
  }).then(botty.sendMessage("SMS Sent Successfully"))
    .then((success) => {
      console.log(success);
    })
  .catch((err) => {
    console.log(err);
  });
});
