var flatiron = require('flatiron'),
    app = flatiron.app,
    fs = require('fs');

var match = function(url, filename) {
  app.router.get(url, function () {
    var self = this;
      fs.readFile(filename, function(err, data) {
      if(err) {
        self.res.writeHead(404);
        self.res.end("404 - Page Not Found");
        return;
      }
      self.res.writeHead(200, {'Content-Type': 'text/html'});
      self.res.end(data);
   });
  });
}

exports.match = match;