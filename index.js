var express = require('express');
var bodyParser = require('body-parser');
var bot = require('./bot');
var multer = require('multer');
var config = require('./config');
var needle = require('needle');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './upload')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
});

var upload = multer({ storage: storage });

//Initialize  a new bot class
var botty = new bot();
botty.init();

//Initialize Express Web Server
var app = express();
app.use('/download', express.static('upload'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
    .then((message) => {
      console.log("Succesfully processed message: " + message.text);
    })
    .catch((err) => {
      console.log("Error processing message:");
      console.error(err);
    });
});

app.post('/upload', upload.single('image'), (req, res, next) => {
  console.log('Received Request');
  console.log("Posting " + req.file.filename + " To RoomID: " + req.body.room);
  res.send('Thanks');
  botty.sendMessage({
    roomId: req.body.room,
    text: 'Here is your requested image: ',
    files: [config.webhookUrl + '/download/' + req.file.filename]
  });
});

app.post('/command', (req, res) => {
  console.log('Received Command Update');
  res.send('Thanks');
  botty.sendMessage({
    roomId: req.body.room,
    text: req.body.text
  })
  .catch((err) => {
    console.log('Error Caught: ');
    console.log(err);
  });
});

// Start listening on port 80 or the port defined in environment variables
app.listen(process.env.PORT || 80, function () {
  console.log('Spark Botty Up and running on port 80');
});


// Define BOT handler method for /echo *text*
botty.onText(/\/echo (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMsg(text, message.roomId).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing :");
    console.error(err);
  });
});

// Define BOT Handler method for /call *text*
botty.onText(/\/call (.+)/, (message, regArray) => {
  text = "Echoing: " + regArray[1];
  botty.sendMsg(text, message.roomId).then(() => {
    console.log("Succesfully Echoed.");
  }).catch((err) => {
    console.log("Error Echoing :");
  });
});

// Define BOT Handler method for /text *text*
botty.onText(/\/text\s(\+1\d{10})\s(.+)/, (message, regArray) => {
  botty.sendSMS(regArray[1], regArray[2]).then((status) => {
    console.log(status);
  }).then(botty.sendMsg(("SMS Sent Successfully"), message.roomId))
    .then((success) => {
      console.log(success);
    })
  .catch((err) => {
    console.log("Error Sending SMS: ");
    console.error(err);
  });
});

botty.onText(/\/pi picture/, (message, regArray) => {
  var data = {
    room: message.roomId,
    type: 'image',
    uploadurl: config.webhookUrl + '/upload'
  }

  needle.post('http://98.248.114.42:4040/image', data, (err, res, body) => {
    console.log('Posted to Raspberry Pi Image');
  });
});

botty.onText(/\/pi video/, (message, regArray) => {
  var data = {
    room: message.roomId,
    type: 'video',
    timeout: '60',
    uploadurl: config.webhookUrl + '/command'
  }

  needle.post('http://98.248.114.42:4040/video', data, (err, res, body) => {
    console.log('Posted to Raspberry Pi Video');
  });
});
