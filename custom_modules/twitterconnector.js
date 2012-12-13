var http = require("http");

function TwitterConnector() {
  this.method = 'GET';
  this.host = 'search.twitter.com';
  this.path = '/search.json?q=';
} 

TwitterConnector.prototype.search = function(tag, callback) {
  console.log("Search "+tag);
  var options = {method: this.method, host: this.host, path: this.path + tag};

  var req = http.request(options, function(res) {

    var responseData = [];

    res.on('data', function(chunk){
      responseData.push(chunk);
    });

    res.on('end', function() {
      var tweets = JSON.parse(responseData.join('')).results;
      callback(tweets);
    });

  }).end();
}

exports.TwitterConnector = TwitterConnector;