var flatiron = require('flatiron'),
    app = flatiron.app,
    fs = require('fs'),
    plates = require('plates');


var genTalkPage = function(talk, html, previousTalk, nextTalk) {
    var partialMessages = "";
    talk.messages.forEach(function(message) {
       partialMessages += "<li><strong>" + message.author + "</strong> : " + message.content + "</li>";
    });

    var nextTalkPermalink = "";
    var previousTalkPermalink = "";
    if(nextTalk) { nextTalkPermalink = "Next : <a href='/talk/"+nextTalk.permalink+"'>"+nextTalk.permalink+"</a>"; }
    if(previousTalk) { previousTalkPermalink = "Previous : <a href='/talk/"+previousTalk.permalink+"'>"+previousTalk.permalink+"</a>"; }

    var subtitle = "Author : "+talk.first_author+" - Chan : #"+talk.chan_name;
    return plates.bind(html, {"messages-list" : partialMessages, "talk-name" : talk.sentence_id, "subtitle" : subtitle,
                              "previous-talk" : previousTalkPermalink, "next-talk" : nextTalkPermalink});
}


var matchStatic = function(url, filename, mime) {
  app.router.get(url, function () {
    var self = this;
      fs.readFile(filename, "utf-8", function(err, html) {
      if(err) {
        self.res.writeHead(404);
        self.res.end("404 - Page Not Found");
        return;
      }

      self.res.writeHead(200, {'Content-Type': mime});
      self.res.end(html);
   });
  });
}


var resources = function(name, collection, columnName, callback)
{
  app.router.get('/'+ name +'/:id', function (id) {
      var self = this;

      fs.readFile("public/views/"+ name + ".html", 'utf-8', function(err, data) {
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
          collection.find({}, {sort: {_id: -1}}).toArray(function(err, results) {

              var previousTalk = null;
              var nextTalk = null;

              for(var i = 0; i < results.length; i++) {
                if(String(results[i]._id) == String(result._id)) {
                  var previousTalk = results[i + 1];
                  if(results[i - 1]) {
                    var nextTalk = results[i - 1];
                  }
                  break;
                }
              }

              self.res.writeHead(200, {'Content-Type': 'text/html'});
              self.res.end(callback(result, data, previousTalk, nextTalk));
            });
        }
      });
   });
  });
}

var defineResources = function(collectionTalks) {
  resources("talk", collectionTalks, 'permalink', genTalkPage);
}

var defineStaticPages = function() {

  matchStatic('/', 'public/index.html', 'text/html');
/*
  var globalDir = 'public';
  var assetsDir = ['css', 'javascript'];

  assetsDir.forEach(function(dir) {
    fs.readdir(globalDir+'/'+dir, function(err, list) {
      list.forEach(function (file) {
        matchStatic(file, globalDir+'/'+dir+'/'+file, 'text/'+dir);
      });
    });
  });*/
}


exports.defineResources = defineResources;
exports.defineStaticPages = defineStaticPages;