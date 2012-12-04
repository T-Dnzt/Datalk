var flatiron = require('flatiron'),
    app = flatiron.app,
    fs = require('fs'), 
    plates = require('plates');


var genTalkPage = function(talk, html) {
    var partialMessages = "";
    talk.messages.forEach(function(message) { 
       partialMessages += "<li><strong>" + message.author + "</strong> : " + message.content + "</li>";
    });
    return plates.bind(html, {"messages-list" : partialMessages, "talk-name" : talk.permalink});
}


var matchStatic = function(url, filename, mime) {
  app.router.get(url, function () {
    var self = this;
      fs.readFile(filename, function(err, data) {
      if(err) {
        self.res.writeHead(404);
        self.res.end("404 - Page Not Found");
        return;
      }
      self.res.writeHead(200, {'Content-Type': mime});
      self.res.end(data);
   });
  });
}


var resources = function(name, collection, columnName, callback) 
{
  app.router.get('/talk/:id', function (id) {  
      var self = this;

      fs.readFile(name + ".html", 'utf-8', function(err, data) {
      if(err) {
        self.res.writeHead(404);
        self.res.end("404 - Page Not Found");
        return;
      }
      var query = {};
      query[columnName] = id;
      collection.findOne(query, function(err, result) {
        if (result)
        {
            self.res.writeHead(200, {'Content-Type': 'text/html'});
            self.res.end(callback(result, data));
        }
      }); 
   });
  });
}

var defineResources = function(collectionTalks) {
  resources("talk", collectionTalks, 'permalink', genTalkPage);
}

var defineStaticPages = function() {
  matchStatic('/', 'index.html', 'text/html');
  matchStatic('/app', 'app.css', 'text/css');
}


exports.defineResources = defineResources;
exports.defineStaticPages = defineStaticPages;