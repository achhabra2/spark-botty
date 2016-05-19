var Spark = require('csco-spark');
var config = require('./config');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var rp = require('request-promise');
var https = require('https');

// Initialize Spark API
var spark = Spark({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

// Configure bearer token from environment variables
var token = "Bearer " + config.token;

// This is used for listing existing webhooks to construct HTTPS POST req
var webhookOptions = {
    uri: 'https://api.ciscospark.com/v1/webhooks',
    headers: {
         'Authorization': token,
         'Content-Type': 'application/json; charset=utf-8',
    },
    json: true // Automatically parses the JSON string in the response
};

// This is used for listing rooms as a HTTPS POST req
var roomOptions = {
    uri: 'https://api.ciscospark.com/v1/rooms',
    headers: {
         'Authorization': token,
         'Content-Type': 'application/json; charset=utf-8',
    },
    json: true // Automatically parses the JSON string in the response
};

// Match existing webhooks with existing room memberships
var _matchExisting = (rooms, webhooks) => {
  var newWebhooks = [];
  for(i=0; i<rooms.length; i++) {
    var match = false;
    for(j=0; j<webhooks.length; j++) {
      if (webhooks[j].filter.substring(7,webhooks[j].filter.length) == rooms[i].id) {
        console.log("***INFO*** Match found at :" + webhooks[j].filter);
        match = true;
        break;
      };
    };
    if (!match) {
      newWebhooks.push(rooms[i].id);
    };
  };
  return new Promise(function (resolve, reject) {
    if(newWebhooks.length == 0) {
      console.log("***INFO*** No new webhooks to be added. ");
      resolve(newWebhooks);
    }
    else {
      console.log("***INFO*** New webhooks to be added:" + newWebhooks);
      resolve(newWebhooks);
    };
  });
};

// Method: get existing rooms and webhooks and return the combined response
var _queryExisting = () => {
  return new Promise(function(resolve, reject) {
    if (config.token == undefined)
      reject("No config token defined");
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

var _checkWebhooks = (arrays) => {
  var webhooks = arrays[1].items;
  var deleteHooks = [];
  if (webhooks.length > 0) {
    return new Promise(function(resolve, reject) {
      console.log("***INFO*** Checking Existing Webhooks against config URL.");
      for(i = 0; i < webhooks.length; i++) {
        console.log("***INFO*** Existing Webhook: " + webhooks[i].targetUrl);
        console.log("***INFO*** Config URL: " + config.webhookUrl);
        if (webhooks[i].targetUrl != config.webhookUrl) {
          deleteHooks.push(webhooks[i].id);
          }
      }
      console.log(deleteHooks);
      resolve(deleteHooks);
    });
  }
  else {
    return new Promise(function(resolve, reject) {
      console.log("***INFO*** No conflicting webhooks found");
      resolve(deleteHooks);
    })
  };
};

var _deleteHooks = (webhooks) => {
  var promises = [];
  console.log("***DEBUG*** Executing _deleteHooks");
  for (i = 0; i < webhooks.length; i++) {
    console.log("***INFO*** Deleting Webhook with ID: " + webhooks[i]);
    promises.push(spark.deleteWebhook(webhooks[i]));
  }
  return Promise.all(promises);
}

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
        .then((message) => {
          resolve(message)
        })
        .catch((err) => {
          reject(err);
          });
    });
  };

  var _respondTo = (body, responseArray) => {
    //Process Message via RegEx
    var message = JSON.parse(body);
    var messageText = message.text;
    var result = null;
    return new Promise(function(resolve,reject) {
      responseArray.forEach((reg) => {
         // debug('Matching %s whith', messageText, reg.regexp);
         result = reg.regexp.exec(messageText);
         if (result) {
           // debug('Matches', reg.regexp);
           reg.callback(message, result);
           resolve(message);
         }
         else reject("No Matching response type found.");
       });
    });
  };

  Botty.prototype.sendMessage = (text, roomId) => {
    return new Promise(function(resolve,reject) {
      spark.sendMessage({
        roomId: roomId,
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

      options.path = '&to=' + number + '&msg=' + message;
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

// Initialize the bot by checking existing rooms against webhooks
// If the webhooks are not found they get added so the bot will monitor
  Botty.prototype.init = () => {
    console.log("Welcome to Spark Botty!");
    _queryExisting()
      .then((arrays) => {
        return _checkWebhooks(arrays);
      })
        .then((hooks) => {
          return _deleteHooks(hooks);
        })
        .then((promised) => {
          console.log("***DEBUG*** Promise.all Yielded: " + promised);
          return _queryExisting();
        })
        .then((query) => {
          return _matchExisting(query[0].items,query[1].items);
        })
        .then((hooks) => {
          if(hooks.length > 0) {
            hooks.forEach((hook) => {
              spark.addWebhook({
              name: 'Botty Webhook',
              hookUrl: config.webhookUrl,
              roomId: hook,
            })
              .then((resp) => {
                // Do Not have to Perform JSON.parse()
                // We are logging the webhook ID to the console
                console.log("***INFO*** Succesfully added Webhook with ID: " + resp.id);
              });
          });
        }
      });
    };

};

module.exports = Botty;
