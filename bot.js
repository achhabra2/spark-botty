var Spark = require('csco-spark');
var config = require('./config');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var rp = require('request-promise');

// Initialize Spark API
var spark = Spark({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

var token = "Bearer " + config.token;

var webhookOptions = {
    uri: 'https://api.ciscospark.com/v1/webhooks',
    headers: {
         'Authorization': token,
         'Content-Type': 'application/json; charset=utf-8',
    },
    json: true // Automatically parses the JSON string in the response
};

var roomOptions = {
    uri: 'https://api.ciscospark.com/v1/rooms',
    headers: {
         'Authorization': token,
         'Content-Type': 'application/json; charset=utf-8',
    },
    json: true // Automatically parses the JSON string in the response
};

var _matchExisting = (rooms, webhooks) => {
  var newWebhooks = [];
  for(i=0; i<rooms.length; i++) {
    var match = false;
    for(j=0; j<webhooks.length; j++) {
      if (webhooks[j].filter.substring(7,webhooks[j].filter.length) == rooms[i].id) {
        console.log("Match found at :" + webhooks[j].filter);
        match = true;
        break;
      };
    };
    if (!match) {
      newWebhooks.push(rooms[j].id);
    };
  };
  return new Promise(function (resolve, reject) {
    if(newWebhooks == null) {
      reject("No new Webhooks");
    }
    else {
      console.log(newWebhooks);
      resolve(newWebhooks);
    };
  });
};

var _queryExisting = () => {
  return new Promise(function(resolve, reject) {
    var p1 = rp(roomOptions);
    var p2 = rp(webhookOptions);
    Promise.all([p1,p2]).then((response) =>{
      resolve(response);
    }).catch((err) =>{
      console.error(err);
      reject(err);
    })
  })
};


/* This is our bot class that gets exported
*/
var Botty = function (params) {
  // A method of the Bot class that echoes a message back to the room
  this.textRegexpCallbacks = [];

  this.processMessage = (msgId) => {
    var responseArray = this.textRegexpCallbacks;
    return new Promise(function(resolve,reject) {
      // Get Incoming Message Text
      spark.getMessage(msgId)
        .then( (body) => {
          _respondTo(body,responseArray);
        })
        .then((messageText) => {
          resolve(messageText)
        })
        .catch((err) => {
          reject(err);
          });
    });
  };

  var _respondTo = (message, responseArray) => {
    //Process Message via RegEx
    var messageText = JSON.parse(message).text;
    var result = null;
    return new Promise(function(resolve,reject) {
      responseArray.forEach((reg) => {
         // debug('Matching %s whith', messageText, reg.regexp);
         result = reg.regexp.exec(messageText);
         if (result) {
           // debug('Matches', reg.regexp);
           reg.callback(messageText, result);
           resolve(messageText);
         }
         else reject("No Matching response type found.");
       });
    });
  };

  Botty.prototype.sendMessage = (text) => {
    return new Promise(function(resolve,reject) {
      spark.sendMessage({
        roomId:config.monitorRoom,
        text: text,
        }).then((res) => {
          console.log("Successfully sent message: " + text);
          resolve(text);
        }).catch((err) => {
          reject(err);
        });
    });
  };

  Botty.prototype.onText = (regexp, callback) => {
    console.log("Regex registered: " + regexp);
    this.textRegexpCallbacks.push({ regexp, callback });
  };

  Botty.prototype.sendSMS = (number, message) => {
    return new Promise(function(resolve,reject) {
      var options = {
        host: 'api.tropo.com',
        port: 443,
        path: '/1.0/sessions?action=create&token=7a517855775544695a674c55727272666261564d546f4e475347524b597872727078537264436875696f5769',
        method: 'GET',
        headers: { accept: '*/*' }
      };

      options.path += '&to=';
      options.path += number;
      options.path += '&msg=';
      options.path += message;
      options.path = encodeURI(options.path);

      var req = https.request(options, function(res) {
        console.log(res.statusCode);
        res.on('data', function(d) {
          process.stdout.write(d);
        });
      });
      req.end();
      req.on('error', function(e) {
        console.error(e);
        reject(e);
      });
      resolve("Sent text successfully");
    });

  };

  Botty.prototype.init = () => {
    _queryExisting()
      .then((arrays) => {
        _matchExisting(arrays[0].items,arrays[1].items)
        .then((hooks) => {
          hooks.forEach((hook) => {
            spark.addWebhook({
            name: 'Botty Webhook',
            hookUrl: config.webhookUrl,
            roomId: hook,
          })
        .then((resp) => {
            // Do Not have to Perform JSON.parse()
            // We are logging the webhook ID to the console
            console.log("Added Webhook ID is: " + resp.id);
          });
        });
      });
    });
  }

};

module.exports = Botty;
