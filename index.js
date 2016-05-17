var express = require('express');
var bodyParser = require('body-parser');
var bot = require('./bot');

//Initialize bot class
var botty = new bot();
botty.init();

//Initialize Express Web Server
var app = express();
app.use(bodyParser.json());

//Define a handler for HTTP Get on /
app.get('/', function (req, res) {
  res.send('Hello World!');
});

//Define a handler for HTTP POST on /
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
      console.log("Error processing message:");
      console.error(err);
    });
});

// Start listening on port 80 or the port defined in environment variables
app.listen(process.env.PORT || 80, function () {
  console.log('Spark Botty Up and running on port 80');
});


// Define BOT handler method for /echo *text*
botty.onText(/\/echo (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMessage(text, message.roomId).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing :");
    console.error(err);
  });
});

// Define BOT Handler method for /call *text*
botty.onText(/\/call (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMessage(text, message.roomId).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing :");
  });
});

// Define BOT Handler method for /text *text*
botty.onText(/\/text\s(\+1\d{10})\s(.+)/, (message, regArray) => {
  botty.sendSMS(regArray[1], regArray[2]).then((status) => {
    console.log(status);
  }).then(botty.sendMessage(("SMS Sent Successfully"), message.roomId))
    .then((success) => {
      console.log(success);
    })
  .catch((err) => {
    console.log("Error Sending SMS: ");
    console.error(err);
  });
});
