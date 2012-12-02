var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    fs = require('fs');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

app.router.get('/', function () {
  var self = this;
  fs.readFile('index.html', function(err, data) {
    if(err) {
      Console.log(err);
      self.res.writeHead(404);
      self.res.end();
      return;
    }
    self.res.writeHead(200, {'Content-Type': 'text/html'});
    self.res.end(data);
  })
});

app.start(3000);
