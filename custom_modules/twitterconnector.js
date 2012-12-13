var http = require("http");

function TwitterConnector() {
  this.options = {
    method: 'GET',
    host: 'search.twitter.com'
  }
  this.tweets = [];
  this.init = false;
  this.interv = null;
}

TwitterConnector.prototype.setup = function(tag, callback) {
  var connector = this;

    if(this.init == false) {
        this.init = true;
        this.interv = setInterval(function(){
            connector.search(tag, callback);
        }, 180000);
    }
}


TwitterConnector.prototype.search = function(tag, callback) {

  var connector = this;
  tag = encodeURI('#'+tag);
  this.options.path = '/search.json?lang=fr&q='+tag;
  http.request(this.options, function(res) {

  var responseData = [];

  res.on('data', function(chunk){
    responseData.push(chunk);
  });

  res.on('end', function() {  
    if (responseData.length > 0) {
        connector.tweets = JSON.parse(responseData.join('')).results;
        if(connector.tweets.length > 0) {
          var random = Math.floor(Math.random() * connector.tweets.length);
          var tweet = connector.tweets[random];
          callback({author: tweet.from_user, content: tweet.text});
        } else {
          callback(null);
        }
    } else {
       callback(null);
    }
  });

  }).end();
}

exports.TwitterConnector = TwitterConnector;